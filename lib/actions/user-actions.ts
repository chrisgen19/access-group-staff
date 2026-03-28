"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireRole, requireSession } from "@/lib/auth-utils";
import { canAssignRole } from "@/lib/permissions";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import type { Role } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: unknown) {
	try {
		const session = await requireRole("ADMIN");
		const parsed = createUserSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const { role, email, password, firstName, lastName, ...rest } = parsed.data;

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

		const updated = await prisma.user.update({
			where: { id: result.user.id },
			data: {
				role: role as Role,
				displayName: rest.displayName,
				phone: rest.phone,
				position: rest.position,
				departmentId: rest.departmentId ?? null,
				isActive: rest.isActive,
			},
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

		if (parsed.data.role && !canAssignRole(session.user.role as Role, parsed.data.role as Role)) {
			return { success: false as const, error: "Insufficient permissions to assign this role" };
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: {
				...parsed.data,
				role: parsed.data.role ? (parsed.data.role as Role) : undefined,
				name:
					parsed.data.firstName && parsed.data.lastName
						? `${parsed.data.firstName} ${parsed.data.lastName}`
						: undefined,
			},
		});

		revalidatePath("/dashboard/users");
		revalidatePath(`/dashboard/users/${userId}`);
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to update user";
		return { success: false as const, error: message };
	}
}

export async function toggleUserActiveAction(userId: string) {
	try {
		await requireRole("ADMIN");
		const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
		const updated = await prisma.user.update({
			where: { id: userId },
			data: { isActive: !user.isActive },
		});

		revalidatePath("/dashboard/users");
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to update user status";
		return { success: false as const, error: message };
	}
}

export async function getUsersAction() {
	try {
		await requireRole("ADMIN");
		const users = await prisma.user.findMany({
			include: { department: true },
			orderBy: { createdAt: "desc" },
		});
		return { success: true as const, data: users };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to fetch users";
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
