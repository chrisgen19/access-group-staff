import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireRole: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		department: {
			findMany: vi.fn(),
		},
		subDepartment: {
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findUnique: vi.fn(),
		},
		user: {
			count: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import { Prisma } from "@/app/generated/prisma/client";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
	addSubDepartmentMemberAction,
	assignTeamLeaderAction,
	createSubDepartmentAction,
	deleteSubDepartmentAction,
	getDepartmentsAction,
	getDepartmentsWithSubDepartmentsAction,
	getSubDepartmentMembersDataAction,
	removeSubDepartmentMemberAction,
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
	function mockTransaction(userCount: number) {
		const tx = {
			user: { count: vi.fn().mockResolvedValue(userCount) },
			subDepartment: { delete: vi.fn().mockResolvedValue({ id: "sub_1" }) },
		};
		vi.mocked(prisma.$transaction).mockImplementation((async (cb: (client: unknown) => unknown) =>
			cb(tx)) as never);
		return tx;
	}

	test("blocks deletion while users are still assigned", async () => {
		const tx = mockTransaction(3);

		const result = await deleteSubDepartmentAction("sub_1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/reassign users/i);
		}
		expect(tx.subDepartment.delete).not.toHaveBeenCalled();
	});

	test("deletes within a serializable transaction when no users are assigned", async () => {
		const tx = mockTransaction(0);

		const result = await deleteSubDepartmentAction("sub_1");

		expect(result.success).toBe(true);
		expect(tx.subDepartment.delete).toHaveBeenCalledWith({ where: { id: "sub_1" } });
		expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
			isolationLevel: "Serializable",
		});
	});
});

describe("getDepartmentsAction", () => {
	test("returns departments with sub-departments and user counts", async () => {
		const departments = [{ id: "dept_1", name: "IT", subDepartments: [] }];
		vi.mocked(prisma.department.findMany).mockResolvedValue(departments as never);

		const result = await getDepartmentsAction();

		expect(result).toEqual({ success: true, data: departments });
		expect(prisma.department.findMany).toHaveBeenCalledWith({
			include: {
				_count: { select: { users: true } },
				subDepartments: {
					include: {
						_count: { select: { users: true } },
						teamLeader: {
							select: { id: true, firstName: true, lastName: true, avatar: true, image: true },
						},
					},
					orderBy: { name: "asc" },
				},
			},
			orderBy: { name: "asc" },
		});
	});
});

describe("getDepartmentsWithSubDepartmentsAction", () => {
	test("selects only id/name for sub-departments, ordered by name", async () => {
		const departments = [{ id: "dept_1", name: "IT", subDepartments: [] }];
		vi.mocked(prisma.department.findMany).mockResolvedValue(departments as never);

		const result = await getDepartmentsWithSubDepartmentsAction();

		expect(result).toEqual(departments);
		expect(prisma.department.findMany).toHaveBeenCalledWith({
			include: {
				subDepartments: {
					select: { id: true, name: true },
					orderBy: { name: "asc" },
				},
			},
			orderBy: { name: "asc" },
		});
	});
});

describe("assignTeamLeaderAction", () => {
	test("assigns an active member of the parent department", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: "dept_1",
			deletedAt: null,
		} as never);
		vi.mocked(prisma.subDepartment.update).mockResolvedValue({ id: "sub_1" } as never);

		const result = await assignTeamLeaderAction("sub_1", "user_1");

		expect(result.success).toBe(true);
		expect(prisma.subDepartment.update).toHaveBeenCalledWith({
			where: { id: "sub_1" },
			data: { teamLeaderId: "user_1" },
		});
	});

	test("rejects a candidate from a different department", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: "dept_other",
			deletedAt: null,
		} as never);

		const result = await assignTeamLeaderAction("sub_1", "user_1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/parent department/i);
		}
		expect(prisma.subDepartment.update).not.toHaveBeenCalled();
	});

	test("rejects a soft-deleted candidate", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: "dept_1",
			deletedAt: new Date(),
		} as never);

		const result = await assignTeamLeaderAction("sub_1", "user_1");

		expect(result.success).toBe(false);
		expect(prisma.subDepartment.update).not.toHaveBeenCalled();
	});

	test("clears the leader (null) without a membership check", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.subDepartment.update).mockResolvedValue({ id: "sub_1" } as never);

		const result = await assignTeamLeaderAction("sub_1", null);

		expect(result.success).toBe(true);
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
		expect(prisma.subDepartment.update).toHaveBeenCalledWith({
			where: { id: "sub_1" },
			data: { teamLeaderId: null },
		});
	});

	test("rejects when the sub-department does not exist", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue(null as never);

		const result = await assignTeamLeaderAction("missing", "user_1");

		expect(result.success).toBe(false);
		expect(prisma.subDepartment.update).not.toHaveBeenCalled();
	});
});

describe("getSubDepartmentMembersDataAction", () => {
	test("splits the eligible pool into members and assignable", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", subDepartmentId: "sub_1" },
			{ id: "u2", subDepartmentId: "sub_2" },
			{ id: "u3", subDepartmentId: null },
		] as never);

		const result = await getSubDepartmentMembersDataAction("sub_1");

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.members.map((m) => m.id)).toEqual(["u1"]);
			expect(result.data.assignable.map((m) => m.id)).toEqual(["u2", "u3"]);
		}
	});
});

describe("addSubDepartmentMemberAction", () => {
	test("assigns an existing department member without changing their department", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: "dept_1",
			deletedAt: null,
		} as never);
		vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1" } as never);

		const result = await addSubDepartmentMemberAction("sub_1", "u1");

		expect(result.success).toBe(true);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { subDepartmentId: "sub_1", departmentId: "dept_1" },
		});
	});

	test("assigns the parent department for an unassigned user", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: null,
			deletedAt: null,
		} as never);
		vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1" } as never);

		const result = await addSubDepartmentMemberAction("sub_1", "u1");

		expect(result.success).toBe(true);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { subDepartmentId: "sub_1", departmentId: "dept_1" },
		});
	});

	test("rejects a user who belongs to another department", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: "dept_other",
			deletedAt: null,
		} as never);

		const result = await addSubDepartmentMemberAction("sub_1", "u1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/another department/i);
		}
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	test("rejects a soft-deleted user", async () => {
		vi.mocked(prisma.subDepartment.findUnique).mockResolvedValue({
			departmentId: "dept_1",
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			departmentId: "dept_1",
			deletedAt: new Date(),
		} as never);

		const result = await addSubDepartmentMemberAction("sub_1", "u1");

		expect(result.success).toBe(false);
		expect(prisma.user.update).not.toHaveBeenCalled();
	});
});

describe("removeSubDepartmentMemberAction", () => {
	test("clears membership scoped to the team", async () => {
		vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

		const result = await removeSubDepartmentMemberAction("sub_1", "u1");

		expect(result.success).toBe(true);
		expect(prisma.user.updateMany).toHaveBeenCalledWith({
			where: { id: "u1", subDepartmentId: "sub_1" },
			data: { subDepartmentId: null },
		});
	});

	test("rejects when the user is not a member of the team", async () => {
		vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

		const result = await removeSubDepartmentMemberAction("sub_1", "u1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/not a member/i);
		}
	});
});
