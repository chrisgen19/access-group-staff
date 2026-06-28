import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/shift-schedule", () => ({
	upsertShiftSchedule: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
		subDepartment: { findMany: vi.fn() },
		$transaction: vi.fn(),
	},
}));

import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { upsertShiftSchedule } from "@/lib/shift-schedule";
import {
	getLedTeamDataAction,
	setTeamMemberSubDepartmentAction,
	updateTeamMemberAction,
} from "./team-leader-actions";

const LEADER_ID = "leader_1";

/** Make $transaction run its callback against the mocked prisma client. */
function passthroughTransaction() {
	vi.mocked(prisma.$transaction).mockImplementation((async (cb: (client: unknown) => unknown) =>
		cb(prisma)) as never);
}

/** Stub loadLeaderContext: user's department + the sub-departments they lead. */
function mockLeaderContext(departmentId: string | null, ledIds: string[]) {
	vi.mocked(prisma.user.findUnique).mockImplementation((async (args: {
		where: { id: string };
		select?: Record<string, unknown>;
	}) => {
		// loadLeaderContext selects only departmentId.
		if (args.select && "departmentId" in args.select && Object.keys(args.select).length === 1) {
			return { departmentId };
		}
		return null;
	}) as never);
	vi.mocked(prisma.subDepartment.findMany).mockResolvedValue(ledIds.map((id) => ({ id })) as never);
}

/** Stub the target ref lookup (the multi-field user.findUnique). */
function mockTarget(ref: {
	id: string;
	role: string;
	departmentId: string | null;
	subDepartmentId: string | null;
	isLeader: boolean;
	deletedAt: Date | null;
}) {
	vi.mocked(prisma.user.findUnique).mockImplementation((async (args: {
		where: { id: string };
		select?: Record<string, unknown>;
	}) => {
		if (args.select && "departmentId" in args.select && Object.keys(args.select).length === 1) {
			return { departmentId: "dept_a" };
		}
		return {
			id: ref.id,
			role: ref.role,
			departmentId: ref.departmentId,
			subDepartmentId: ref.subDepartmentId,
			deletedAt: ref.deletedAt,
			ledSubDepartments: ref.isLeader ? [{ id: "x" }] : [],
		};
	}) as never);
	vi.mocked(prisma.subDepartment.findMany).mockResolvedValue([{ id: "sub_led" }] as never);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requireSession).mockResolvedValue({
		user: { id: LEADER_ID },
	} as unknown as Awaited<ReturnType<typeof requireSession>>);
	passthroughTransaction();
});

describe("updateTeamMemberAction", () => {
	test("updates position + shift for an editable team member", async () => {
		mockTarget({
			id: "u1",
			role: "STAFF",
			departmentId: "dept_a",
			subDepartmentId: "sub_led",
			isLeader: false,
			deletedAt: null,
		});
		vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1" } as never);

		const result = await updateTeamMemberAction("u1", { position: "BI Dev", shiftSchedule: null });

		expect(result.success).toBe(true);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { position: "BI Dev" },
		});
		expect(upsertShiftSchedule).toHaveBeenCalledWith(prisma, "u1", null);
	});

	test("rejects editing a member outside the leader's teams", async () => {
		mockTarget({
			id: "u1",
			role: "STAFF",
			departmentId: "dept_a",
			subDepartmentId: "sub_other",
			isLeader: false,
			deletedAt: null,
		});

		const result = await updateTeamMemberAction("u1", { position: "Hacker" });

		expect(result.success).toBe(false);
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	test("does not touch the shift schedule when none is submitted", async () => {
		mockTarget({
			id: "u1",
			role: "STAFF",
			departmentId: "dept_a",
			subDepartmentId: "sub_led",
			isLeader: false,
			deletedAt: null,
		});
		vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1" } as never);

		const result = await updateTeamMemberAction("u1", { position: "BI Dev" });

		expect(result.success).toBe(true);
		expect(upsertShiftSchedule).not.toHaveBeenCalled();
	});
});

describe("setTeamMemberSubDepartmentAction", () => {
	test("moves an unassigned member into a led team", async () => {
		mockTarget({
			id: "u1",
			role: "STAFF",
			departmentId: "dept_a",
			subDepartmentId: null,
			isLeader: false,
			deletedAt: null,
		});
		vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1" } as never);

		const result = await setTeamMemberSubDepartmentAction("u1", "sub_led");

		expect(result.success).toBe(true);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { subDepartmentId: "sub_led" },
		});
	});

	test("rejects assigning to a team the leader does not lead", async () => {
		mockTarget({
			id: "u1",
			role: "STAFF",
			departmentId: "dept_a",
			subDepartmentId: null,
			isLeader: false,
			deletedAt: null,
		});

		const result = await setTeamMemberSubDepartmentAction("u1", "sub_other");

		expect(result.success).toBe(false);
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	test("rejects cross-department targets", async () => {
		mockTarget({
			id: "u1",
			role: "STAFF",
			departmentId: "dept_other",
			subDepartmentId: null,
			isLeader: false,
			deletedAt: null,
		});

		const result = await setTeamMemberSubDepartmentAction("u1", "sub_led");

		expect(result.success).toBe(false);
		expect(prisma.user.update).not.toHaveBeenCalled();
	});
});

describe("getLedTeamDataAction", () => {
	test("rejects a team the caller does not lead", async () => {
		mockLeaderContext("dept_a", ["sub_led"]);

		const result = await getLedTeamDataAction("sub_other");

		expect(result.success).toBe(false);
		expect(prisma.user.findMany).not.toHaveBeenCalled();
	});

	test("splits the department pool into members and assignable", async () => {
		mockLeaderContext("dept_a", ["sub_led", "sub_led2"]);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "m1", subDepartmentId: "sub_led" },
			{ id: "m2", subDepartmentId: "sub_led2" },
			{ id: "m3", subDepartmentId: null },
		] as never);

		const result = await getLedTeamDataAction("sub_led");

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.members.map((m) => m.id)).toEqual(["m1"]);
			// m2 (another led team) and m3 (unassigned) are assignable; not m1.
			expect(result.data.assignable.map((m) => m.id)).toEqual(["m2", "m3"]);
		}
	});
});
