"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/app/generated/prisma/client";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { upsertShiftSchedule } from "@/lib/shift-schedule";
import {
	canAssignTeamMember,
	canEditTeamMember,
	type LeaderContext,
	type TeamMemberRef,
} from "@/lib/team-leader";
import { teamMemberUpdateSchema } from "@/lib/validations/user";

type Db = typeof prisma | Prisma.TransactionClient;

class TeamLeaderActionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TeamLeaderActionError";
	}
}

async function loadLeaderContext(db: Db, userId: string): Promise<LeaderContext> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { departmentId: true },
	});
	const departmentId = user?.departmentId ?? null;
	// Only count leaderships within the leader's own department. A leader's
	// teams are always in their department (enforced on assignment, cleared on
	// department change), so scoping here keeps both edit and move authority
	// inside the department and prevents ever writing a sub-department from
	// another department onto a member.
	const led = departmentId
		? await db.subDepartment.findMany({
				where: { teamLeaderId: userId, departmentId },
				select: { id: true },
			})
		: [];
	return {
		userId,
		departmentId,
		ledSubDepartmentIds: led.map((s) => s.id),
	};
}

async function loadTargetRef(db: Db, userId: string): Promise<TeamMemberRef | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			departmentId: true,
			subDepartmentId: true,
			deletedAt: true,
		},
	});
	if (!user) return null;
	return {
		id: user.id,
		departmentId: user.departmentId,
		subDepartmentId: user.subDepartmentId,
		deletedAt: user.deletedAt,
	};
}

export async function getTeamMemberDetailAction(targetId: string) {
	try {
		const session = await requireSession();
		const ctx = await loadLeaderContext(prisma, session.user.id);
		const target = await loadTargetRef(prisma, targetId);
		if (!target || !canEditTeamMember(ctx, target)) {
			return { success: false as const, error: "You can't view this member" };
		}

		const detail = await prisma.user.findUnique({
			where: { id: targetId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				displayName: true,
				email: true,
				phone: true,
				position: true,
				branch: true,
				avatar: true,
				image: true,
				shiftSchedule: { include: { days: { orderBy: { dayOfWeek: "asc" } } } },
			},
		});
		if (!detail) {
			return { success: false as const, error: "Member not found" };
		}
		return { success: true as const, data: detail };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to load member";
		return { success: false as const, error: message };
	}
}

export async function updateTeamMemberAction(targetId: string, formData: unknown) {
	try {
		const session = await requireSession();
		const parsed = teamMemberUpdateSchema.safeParse(formData);
		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}
		const { position, shiftSchedule } = parsed.data;

		await prisma.$transaction(
			async (tx) => {
				const ctx = await loadLeaderContext(tx, session.user.id);
				const target = await loadTargetRef(tx, targetId);
				if (!target || !canEditTeamMember(ctx, target)) {
					throw new TeamLeaderActionError("You can't edit this member");
				}
				// `undefined` leaves position untouched (partial update); only an
				// explicitly-submitted value is written. Avoids nulling position
				// when a caller submits only a shift schedule.
				await tx.user.update({
					where: { id: targetId },
					data: { position },
				});
				if (shiftSchedule !== undefined) {
					await upsertShiftSchedule(tx, targetId, shiftSchedule ?? null);
				}
			},
			{ isolationLevel: "Serializable" },
		);

		revalidatePath("/dashboard/my-team");
		return { success: true as const, data: null };
	} catch (error) {
		if (error instanceof TeamLeaderActionError) {
			return { success: false as const, error: error.message };
		}
		const message = error instanceof Error ? error.message : "Failed to update member";
		return { success: false as const, error: message };
	}
}

export async function setTeamMemberSubDepartmentAction(
	targetId: string,
	destSubDepartmentId: string | null,
	expectedCurrentSubDepartmentId?: string | null,
) {
	try {
		const session = await requireSession();

		await prisma.$transaction(
			async (tx) => {
				const ctx = await loadLeaderContext(tx, session.user.id);
				const target = await loadTargetRef(tx, targetId);
				if (!target || !canAssignTeamMember(ctx, target, destSubDepartmentId)) {
					throw new TeamLeaderActionError("You can't change this member's team");
				}
				// Stale-client guard: the caller states which team they think the
				// member is in (the dialog's team). The Serializable re-read only
				// protects against concurrent transactions, not a browser that read
				// minutes ago — so a leader who leads multiple teams could otherwise
				// remove/move a member from the wrong team via a stale dialog. Reject
				// when the member has since moved so the dialog reloads.
				if (
					expectedCurrentSubDepartmentId !== undefined &&
					target.subDepartmentId !== expectedCurrentSubDepartmentId
				) {
					throw new TeamLeaderActionError("This member's team changed. Reload and try again.");
				}
				await tx.user.update({
					where: { id: targetId },
					data: { subDepartmentId: destSubDepartmentId },
				});
			},
			{ isolationLevel: "Serializable" },
		);

		revalidatePath("/dashboard/my-team");
		return { success: true as const, data: null };
	} catch (error) {
		if (error instanceof TeamLeaderActionError) {
			return { success: false as const, error: error.message };
		}
		const message = error instanceof Error ? error.message : "Failed to update team";
		return { success: false as const, error: message };
	}
}

interface LedTeamPerson {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	image: string | null;
	position: string | null;
	subDepartmentId: string | null;
}

/**
 * Data for the leader's "Manage members" dialog for one of their teams:
 * current members of the team plus the department members they may add (any
 * active member who is unassigned or in another team this leader leads).
 * Verifies the caller actually leads `subDepartmentId`.
 */
export async function getLedTeamDataAction(subDepartmentId: string) {
	try {
		const session = await requireSession();
		const ctx = await loadLeaderContext(prisma, session.user.id);
		if (ctx.departmentId === null || !ctx.ledSubDepartmentIds.includes(subDepartmentId)) {
			return { success: false as const, error: "You don't lead this team" };
		}

		// Any active department member is manageable, regardless of role — a
		// leader owns their team's roster. Excludes only the leader themselves.
		const pool = await prisma.user.findMany({
			where: {
				departmentId: ctx.departmentId,
				deletedAt: null,
				id: { not: session.user.id },
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				avatar: true,
				image: true,
				position: true,
				subDepartmentId: true,
			},
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
		});

		const members: LedTeamPerson[] = pool.filter((p) => p.subDepartmentId === subDepartmentId);
		const assignable: LedTeamPerson[] = pool.filter(
			(p) =>
				p.subDepartmentId !== subDepartmentId &&
				(p.subDepartmentId === null || ctx.ledSubDepartmentIds.includes(p.subDepartmentId)),
		);
		return { success: true as const, data: { members, assignable } };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to load team";
		return { success: false as const, error: message };
	}
}
