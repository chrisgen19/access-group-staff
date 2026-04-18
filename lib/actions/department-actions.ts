"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { departmentSchema } from "@/lib/validations/department";

export async function getDepartmentsAction() {
	try {
		await requireRole("ADMIN");
		const departments = await prisma.department.findMany({
			include: { _count: { select: { users: true } } },
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
