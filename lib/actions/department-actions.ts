"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { departmentSchema, subDepartmentSchema } from "@/lib/validations/department";

class SubDepartmentInUseError extends Error {
	constructor() {
		super("Cannot delete sub-department with assigned users. Reassign users first.");
		this.name = "SubDepartmentInUseError";
	}
}

export async function getDepartmentsAction() {
	try {
		await requireRole("ADMIN");
		const departments = await prisma.department.findMany({
			include: {
				_count: { select: { users: true } },
				subDepartments: {
					include: { _count: { select: { users: true } } },
					orderBy: { name: "asc" },
				},
			},
			orderBy: { name: "asc" },
		});
		return { success: true as const, data: departments };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to fetch departments";
		return { success: false as const, error: message };
	}
}

export async function getAllDepartmentsAction() {
	const departments = await prisma.department.findMany({
		orderBy: { name: "asc" },
	});
	return departments;
}

export async function getDepartmentsWithSubDepartmentsAction() {
	return prisma.department.findMany({
		include: {
			subDepartments: {
				select: { id: true, name: true },
				orderBy: { name: "asc" },
			},
		},
		orderBy: { name: "asc" },
	});
}

export async function createDepartmentAction(formData: unknown) {
	try {
		await requireRole("ADMIN");
		const parsed = departmentSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const department = await prisma.department.create({ data: parsed.data });
		revalidatePath("/dashboard/departments");
		return { success: true as const, data: department };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to create department";
		return { success: false as const, error: message };
	}
}

export async function updateDepartmentAction(id: string, formData: unknown) {
	try {
		await requireRole("ADMIN");
		const parsed = departmentSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const department = await prisma.department.update({
			where: { id },
			data: parsed.data,
		});
		revalidatePath("/dashboard/departments");
		return { success: true as const, data: department };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to update department";
		return { success: false as const, error: message };
	}
}

export async function deleteDepartmentAction(id: string) {
	try {
		await requireRole("ADMIN");
		// Count soft-deleted users too. If we ignored them, deleting the
		// department would null out their saved `department_id` (via
		// ON DELETE SET NULL on the optional relation) and they'd come
		// back without a department on restore — silent data loss.
		const userCount = await prisma.user.count({ where: { departmentId: id } });

		if (userCount > 0) {
			return {
				success: false as const,
				error: "Cannot delete department with assigned users. Reassign users first.",
			};
		}

		await prisma.department.delete({ where: { id } });
		revalidatePath("/dashboard/departments");
		return { success: true as const, data: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to delete department";
		return { success: false as const, error: message };
	}
}

export async function createSubDepartmentAction(departmentId: string, formData: unknown) {
	try {
		await requireRole("ADMIN");
		const parsed = subDepartmentSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const subDepartment = await prisma.subDepartment.create({
			data: { name: parsed.data.name, departmentId },
		});
		revalidatePath("/dashboard/departments");
		return { success: true as const, data: subDepartment };
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return {
				success: false as const,
				error: "A sub-department with this name already exists in this department.",
			};
		}
		const message = error instanceof Error ? error.message : "Failed to create sub-department";
		return { success: false as const, error: message };
	}
}

export async function updateSubDepartmentAction(id: string, formData: unknown) {
	try {
		await requireRole("ADMIN");
		const parsed = subDepartmentSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const subDepartment = await prisma.subDepartment.update({
			where: { id },
			data: { name: parsed.data.name },
		});
		revalidatePath("/dashboard/departments");
		return { success: true as const, data: subDepartment };
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return {
				success: false as const,
				error: "A sub-department with this name already exists in this department.",
			};
		}
		const message = error instanceof Error ? error.message : "Failed to update sub-department";
		return { success: false as const, error: message };
	}
}

export async function deleteSubDepartmentAction(id: string) {
	try {
		await requireRole("ADMIN");
		// Block deletion while users are still assigned. The User → SubDepartment
		// relation is ON DELETE SET NULL, so deleting anyway would silently strip
		// the team from those users. Make admins reassign them first.
		//
		// Count + delete run inside one Serializable transaction so a concurrent
		// reassignment can't slip between the guard and the delete — any such race
		// turns into a serialization failure on one of the transactions.
		await prisma.$transaction(
			async (tx) => {
				const userCount = await tx.user.count({ where: { subDepartmentId: id } });
				if (userCount > 0) {
					throw new SubDepartmentInUseError();
				}
				await tx.subDepartment.delete({ where: { id } });
			},
			{ isolationLevel: "Serializable" },
		);

		revalidatePath("/dashboard/departments");
		return { success: true as const, data: null };
	} catch (error) {
		if (error instanceof SubDepartmentInUseError) {
			return { success: false as const, error: error.message };
		}
		const message = error instanceof Error ? error.message : "Failed to delete sub-department";
		return { success: false as const, error: message };
	}
}
