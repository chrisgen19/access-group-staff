"use server";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma, type Role } from "@/app/generated/prisma/client";
import { extractRequestMeta, logActivity } from "@/lib/activity-log";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canAssignRole } from "@/lib/permissions";
import { upsertShiftSchedule } from "@/lib/shift-schedule";
import { adminResetPasswordSchema } from "@/lib/validations/auth";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";

class LastSuperadminError extends Error {
	constructor() {
		super("Cannot delete the last super admin");
		this.name = "LastSuperadminError";
	}
}

type SubDepartmentResolution = { ok: true; value: string | null } | { ok: false; error: string };

/**
 * Ensures a sub-department assignment is consistent with the user's department.
 * Returns the value to persist (or null), or an error when the sub-department
 * does not belong to the chosen department.
 */
async function resolveSubDepartmentId(
	departmentId: string | null,
	subDepartmentId: string | null,
): Promise<SubDepartmentResolution> {
	if (!subDepartmentId) return { ok: true, value: null };
	if (!departmentId) {
		return { ok: false, error: "Select a department before assigning a sub-department" };
	}
	const subDepartment = await prisma.subDepartment.findUnique({
		where: { id: subDepartmentId },
		select: { departmentId: true },
	});
	if (!subDepartment || subDepartment.departmentId !== departmentId) {
		return {
			ok: false,
			error: "Selected sub-department does not belong to the chosen department",
		};
	}
	return { ok: true, value: subDepartmentId };
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

		const subDept = await resolveSubDepartmentId(
			rest.departmentId ?? null,
			rest.subDepartmentId ?? null,
		);
		if (!subDept.ok) {
			return { success: false as const, error: subDept.error };
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
					subDepartmentId: subDept.value,
					hireDate: rest.hireDate ?? null,
					birthday: rest.birthday ?? null,
				},
			});
			if (shiftSchedule !== undefined) {
				await upsertShiftSchedule(tx, userId, shiftSchedule ?? null);
			}
			return user;
		});

		revalidatePath("/dashboard/users", "layout");
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
			select: { role: true, deletedAt: true, departmentId: true },
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

		const { shiftSchedule, hireDate, birthday, subDepartmentId, ...userFields } = parsed.data;

		// `undefined` leaves the column untouched. Only touch it when the caller
		// explicitly submits a sub-department, or when the department actually
		// changes (which would otherwise strand a sub-department from the old
		// department). A partial update that re-sends the unchanged department
		// must preserve the existing assignment.
		const departmentChanging =
			parsed.data.departmentId !== undefined &&
			parsed.data.departmentId !== targetUser.departmentId;

		let resolvedSubDepartmentId: string | null | undefined;
		if (subDepartmentId !== undefined) {
			const effectiveDepartmentId =
				parsed.data.departmentId !== undefined ? parsed.data.departmentId : targetUser.departmentId;
			const subDept = await resolveSubDepartmentId(
				effectiveDepartmentId ?? null,
				subDepartmentId ?? null,
			);
			if (!subDept.ok) {
				return { success: false as const, error: subDept.error };
			}
			resolvedSubDepartmentId = subDept.value;
		} else if (departmentChanging) {
			resolvedSubDepartmentId = null;
		}

		const updated = await prisma.$transaction(
			async (tx) => {
				const user = await tx.user.update({
					where: { id: userId },
					data: {
						...userFields,
						role: roleIsChanging ? (parsed.data.role as Role) : undefined,
						subDepartmentId: resolvedSubDepartmentId,
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
				// Leaving a department invalidates any team leaderships held there
				// (eligibility requires membership of the parent department), so clear
				// them to avoid a leader stranded over a team they no longer belong to.
				if (departmentChanging) {
					await tx.subDepartment.updateMany({
						where: { teamLeaderId: userId },
						data: { teamLeaderId: null },
					});
				}
				return user;
			},
			// When the department changes we clear team leaderships, which races
			// with assignTeamLeaderAction. Postgres SSI only detects that anomaly
			// when BOTH transactions are Serializable, so match the assign side
			// here. Ordinary edits keep default isolation to avoid needless
			// serialization failures.
			departmentChanging ? { isolationLevel: "Serializable" } : undefined,
		);

		revalidatePath("/dashboard/users", "layout");
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

		const updated = await prisma.$transaction(
			async (tx) => {
				// Re-check guard inside the transaction so two concurrent deletes
				// can't both observe `count === 2` and then both succeed, leaving
				// zero active superadmins. Serializable isolation turns any such
				// race into a serialization failure on one of the transactions.
				if (target.role === "SUPERADMIN") {
					const activeSuperadmins = await tx.user.count({
						where: { role: "SUPERADMIN", deletedAt: null },
					});
					if (activeSuperadmins <= 1) {
						throw new LastSuperadminError();
					}
				}
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
				// A deleted user can no longer lead any team — relinquish leaderships
				// so teams aren't left pointing at a removed account.
				await tx.subDepartment.updateMany({
					where: { teamLeaderId: userId },
					data: { teamLeaderId: null },
				});
				return user;
			},
			{ isolationLevel: "Serializable" },
		);

		revalidatePath("/dashboard/users", "layout");
		revalidatePath(`/dashboard/users/${userId}`);
		return { success: true as const, data: updated };
	} catch (error) {
		if (error instanceof LastSuperadminError) {
			return { success: false as const, error: error.message };
		}
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

		revalidatePath("/dashboard/users", "layout");
		revalidatePath(`/dashboard/users/${userId}`);
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

		const hashedPassword = await hashPassword(parsed.data.newPassword);

		if (account) {
			await prisma.$transaction([
				prisma.account.update({
					where: { id: account.id },
					data: { password: hashedPassword },
				}),
				prisma.session.deleteMany({
					where: { userId },
				}),
			]);
		} else {
			// `accountId === userId` for credential accounts — matches better-auth's
			// internal linkAccount call so subsequent sign-in flows treat it
			// identically to a credential account created at registration.
			try {
				await prisma.account.create({
					data: {
						userId,
						accountId: userId,
						providerId: "credential",
						password: hashedPassword,
					},
				});
			} catch (err) {
				// Race-safety: a concurrent self-service set-password (#151) can
				// pass our `findFirst` check at the same moment the admin does
				// and both reach `create`. The composite unique index on
				// (user_id, provider_id) makes the second insert fail with P2002.
				if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
					return {
						success: false as const,
						error: "A password was just set for this user. Reload and try again.",
					};
				}
				throw err;
			}
		}

		try {
			const { ipAddress, userAgent } = extractRequestMeta(await headers());
			await logActivity({
				action: account ? "PASSWORD_RESET" : "PASSWORD_SET",
				actorId: session.user.id,
				targetType: "user",
				targetId: userId,
				ipAddress,
				userAgent,
			});
		} catch (err) {
			console.error("adminResetPasswordAction post-persist side effects failed", {
				userId,
				error: err instanceof Error ? err.message : String(err),
			});
		}

		return { success: true as const, data: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to reset password";
		return { success: false as const, error: message };
	}
}
