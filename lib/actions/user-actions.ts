"use server";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import type { Prisma, Role } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { requireRole, requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canAssignRole } from "@/lib/permissions";
import { adminResetPasswordSchema } from "@/lib/validations/auth";
import {
	createUserSchema,
	type ShiftScheduleInput,
	updateUserSchema,
} from "@/lib/validations/user";

async function upsertShiftSchedule(
	tx: Prisma.TransactionClient,
	userId: string,
	schedule: ShiftScheduleInput | null,
) {
	if (schedule === null) {
		await tx.shiftSchedule.deleteMany({ where: { userId } });
		return;
	}
	const existing = await tx.shiftSchedule.findUnique({ where: { userId } });
	const scheduleId = existing
		? (
				await tx.shiftSchedule.update({
					where: { userId },
					data: { timezone: schedule.timezone },
				})
			).id
		: (
				await tx.shiftSchedule.create({
					data: { userId, timezone: schedule.timezone },
				})
			).id;

	await tx.shiftDay.deleteMany({ where: { scheduleId } });
	await tx.shiftDay.createMany({
		data: schedule.days.map((day) => ({
			scheduleId,
			dayOfWeek: day.dayOfWeek,
			isWorking: day.isWorking,
			startTime: day.isWorking ? (day.startTime ?? null) : null,
			endTime: day.isWorking ? (day.endTime ?? null) : null,
			breakMins: day.isWorking ? day.breakMins : 0,
		})),
	});
}

export async function createUserAction(formData: unknown) {
	try {
		const session = await requireRole("ADMIN");
		const parsed = createUserSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const { role, email, password, firstName, lastName, shiftSchedule, ...rest } = parsed.data;

		if (!canAssignRole(session.user.role as Role, role as Role)) {
			return { success: false as const, error: "Insufficient permissions to assign this role" };
		}

		const result = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: `${firstName} ${lastName}`,
				firstName,
				lastName,
			},
		});

		if (!result.user) {
			return { success: false as const, error: "Failed to create user" };
		}

		const userId = result.user.id;
		const updated = await prisma.$transaction(async (tx) => {
			const user = await tx.user.update({
				where: { id: userId },
				data: {
					role: role as Role,
					displayName: rest.displayName,
					phone: rest.phone,
					position: rest.position,
					branch: rest.branch ?? null,
					departmentId: rest.departmentId ?? null,
					hireDate: rest.hireDate ?? null,
					birthday: rest.birthday ?? null,
				},
			});
			if (shiftSchedule !== undefined) {
				await upsertShiftSchedule(tx, userId, shiftSchedule ?? null);
			}
			return user;
		});

		revalidatePath("/dashboard/users");
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to create user";
		return { success: false as const, error: message };
	}
}

export async function updateUserAction(userId: string, formData: unknown) {
	try {
		const session = await requireRole("ADMIN");
		const parsed = updateUserSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { role: true, deletedAt: true },
		});

		if (!targetUser) {
			return { success: false as const, error: "User not found" };
		}

		if (targetUser.deletedAt !== null) {
			return { success: false as const, error: "Cannot edit a deleted user. Restore them first." };
		}

		// Only gate on role-assignment permissions when the role is actually
		// changing. An admin editing another admin's name (or any non-role
		// field) submits the target's existing role as a no-op — rejecting
		// that would block benign edits.
		const roleIsChanging = !!parsed.data.role && parsed.data.role !== targetUser.role;
		if (roleIsChanging && !canAssignRole(session.user.role as Role, parsed.data.role as Role)) {
			return { success: false as const, error: "Insufficient permissions to assign this role" };
		}

		const { shiftSchedule, hireDate, birthday, ...userFields } = parsed.data;
		const updated = await prisma.$transaction(async (tx) => {
			const user = await tx.user.update({
				where: { id: userId },
				data: {
					...userFields,
					role: roleIsChanging ? (parsed.data.role as Role) : undefined,
					hireDate: hireDate === undefined ? undefined : (hireDate ?? null),
					birthday: birthday === undefined ? undefined : (birthday ?? null),
					name:
						parsed.data.firstName && parsed.data.lastName
							? `${parsed.data.firstName} ${parsed.data.lastName}`
							: undefined,
				},
			});
			if (shiftSchedule !== undefined) {
				await upsertShiftSchedule(tx, userId, shiftSchedule ?? null);
			}
			return user;
		});

		revalidatePath("/dashboard/users");
		revalidatePath(`/dashboard/users/${userId}`);
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to update user";
		return { success: false as const, error: message };
	}
}

export async function softDeleteUserAction(userId: string) {
	try {
		const session = await requireRole("ADMIN");

		if (userId === session.user.id) {
			return { success: false as const, error: "You cannot delete your own account" };
		}

		const target = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, role: true, deletedAt: true },
		});

		if (!target) {
			return { success: false as const, error: "User not found" };
		}

		if (target.deletedAt !== null) {
			return { success: false as const, error: "User is already deleted" };
		}

		if (target.role === "SUPERADMIN") {
			const activeSuperadmins = await prisma.user.count({
				where: { role: "SUPERADMIN", deletedAt: null },
			});
			if (activeSuperadmins <= 1) {
				return { success: false as const, error: "Cannot delete the last super admin" };
			}
		}

		const updated = await prisma.$transaction(async (tx) => {
			const user = await tx.user.update({
				where: { id: userId },
				data: {
					deletedAt: new Date(),
					deletedById: session.user.id,
					// Mirror into the deprecated `isActive` column so any
					// still-running old release renders them correctly.
					isActive: false,
				},
			});
			await tx.session.deleteMany({ where: { userId } });
			return user;
		});

		revalidatePath("/dashboard/users");
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to delete user";
		return { success: false as const, error: message };
	}
}

export async function restoreUserAction(userId: string) {
	try {
		await requireRole("ADMIN");

		const target = await prisma.user.findUnique({
			where: { id: userId },
			select: { deletedAt: true },
		});

		if (!target) {
			return { success: false as const, error: "User not found" };
		}

		if (target.deletedAt === null) {
			return { success: false as const, error: "User is not deleted" };
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: { deletedAt: null, deletedById: null, isActive: true },
		});

		revalidatePath("/dashboard/users");
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to restore user";
		return { success: false as const, error: message };
	}
}

export async function getUsersAction() {
	try {
		await requireRole("ADMIN");
		const users = await prisma.user.findMany({
			where: { deletedAt: null },
			include: { department: true },
			orderBy: { createdAt: "desc" },
		});
		return { success: true as const, data: users };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to fetch users";
		return { success: false as const, error: message };
	}
}

export async function adminResetPasswordAction(userId: string, formData: unknown) {
	try {
		const session = await requireRole("ADMIN");
		const parsed = adminResetPasswordSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { role: true, deletedAt: true },
		});

		if (!targetUser) {
			return { success: false as const, error: "User not found" };
		}

		if (targetUser.deletedAt !== null) {
			return {
				success: false as const,
				error: "Cannot reset password for a deleted user. Restore them first.",
			};
		}

		if (!canAssignRole(session.user.role as Role, targetUser.role)) {
			return {
				success: false as const,
				error: "Insufficient permissions to reset this user's password",
			};
		}

		const account = await prisma.account.findFirst({
			where: { userId, providerId: "credential" },
		});

		if (!account) {
			return { success: false as const, error: "User does not have a password-based account" };
		}

		const hashedPassword = await hashPassword(parsed.data.newPassword);

		await prisma.$transaction([
			prisma.account.update({
				where: { id: account.id },
				data: { password: hashedPassword },
			}),
			prisma.session.deleteMany({
				where: { userId },
			}),
		]);

		return { success: true as const, data: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to reset password";
		return { success: false as const, error: message };
	}
}

export async function getUserByIdAction(userId: string) {
	try {
		await requireSession();
		const user = await prisma.user.findUniqueOrThrow({
			where: { id: userId },
			include: { department: true },
		});
		return { success: true as const, data: user };
	} catch (error) {
		const message = error instanceof Error ? error.message : "User not found";
		return { success: false as const, error: message };
	}
}
