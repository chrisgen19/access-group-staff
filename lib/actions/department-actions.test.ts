import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireRole: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		subDepartment: {
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		user: {
			count: vi.fn(),
		},
	},
}));

import { Prisma } from "@/app/generated/prisma/client";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
	createSubDepartmentAction,
	deleteSubDepartmentAction,
	updateSubDepartmentAction,
} from "./department-actions";

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requireRole).mockResolvedValue({
		user: { id: "admin_1", role: "ADMIN" as const },
	} as unknown as Awaited<ReturnType<typeof requireRole>>);
});

describe("createSubDepartmentAction", () => {
	test("creates a sub-department under the department", async () => {
		vi.mocked(prisma.subDepartment.create).mockResolvedValue({
			id: "sub_1",
			name: "Team Power BI",
			departmentId: "dept_1",
		} as never);

		const result = await createSubDepartmentAction("dept_1", { name: "Team Power BI" });

		expect(result.success).toBe(true);
		expect(prisma.subDepartment.create).toHaveBeenCalledWith({
			data: { name: "Team Power BI", departmentId: "dept_1" },
		});
	});

	test("rejects an empty name without touching the database", async () => {
		const result = await createSubDepartmentAction("dept_1", { name: "   " });

		expect(result.success).toBe(false);
		expect(prisma.subDepartment.create).not.toHaveBeenCalled();
	});

	test("returns a friendly error on a duplicate name (P2002)", async () => {
		vi.mocked(prisma.subDepartment.create).mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
				code: "P2002",
				clientVersion: "test",
			}),
		);

		const result = await createSubDepartmentAction("dept_1", { name: "Team Power BI" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/already exists/i);
		}
	});
});

describe("updateSubDepartmentAction", () => {
	test("updates the sub-department name", async () => {
		vi.mocked(prisma.subDepartment.update).mockResolvedValue({ id: "sub_1" } as never);

		const result = await updateSubDepartmentAction("sub_1", { name: "Renamed" });

		expect(result.success).toBe(true);
		expect(prisma.subDepartment.update).toHaveBeenCalledWith({
			where: { id: "sub_1" },
			data: { name: "Renamed" },
		});
	});
});

describe("deleteSubDepartmentAction", () => {
	test("blocks deletion while users are still assigned", async () => {
		vi.mocked(prisma.user.count).mockResolvedValue(3 as never);

		const result = await deleteSubDepartmentAction("sub_1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/reassign users/i);
		}
		expect(prisma.subDepartment.delete).not.toHaveBeenCalled();
	});

	test("deletes when no users are assigned", async () => {
		vi.mocked(prisma.user.count).mockResolvedValue(0 as never);
		vi.mocked(prisma.subDepartment.delete).mockResolvedValue({ id: "sub_1" } as never);

		const result = await deleteSubDepartmentAction("sub_1");

		expect(result.success).toBe(true);
		expect(prisma.subDepartment.delete).toHaveBeenCalledWith({ where: { id: "sub_1" } });
	});
});
