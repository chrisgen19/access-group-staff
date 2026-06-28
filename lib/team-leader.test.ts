import { describe, expect, test } from "vitest";
import {
	canAssignTeamMember,
	canEditTeamMember,
	isTeamLeader,
	type LeaderContext,
	type TeamMemberRef,
} from "./team-leader";

const ctx: LeaderContext = {
	userId: "leader_1",
	departmentId: "dept_a",
	ledSubDepartmentIds: ["sub_led", "sub_led2"],
};

function member(overrides: Partial<TeamMemberRef> = {}): TeamMemberRef {
	return {
		id: "user_1",
		departmentId: "dept_a",
		subDepartmentId: "sub_led",
		deletedAt: null,
		...overrides,
	};
}

describe("isTeamLeader", () => {
	test("true when leading at least one sub-department", () => {
		expect(isTeamLeader(ctx)).toBe(true);
		expect(isTeamLeader({ ...ctx, ledSubDepartmentIds: [] })).toBe(false);
	});
});

describe("canEditTeamMember", () => {
	test("allows editing any active member of a led team, regardless of role", () => {
		expect(canEditTeamMember(ctx, member())).toBe(true);
	});

	test("rejects a member not in a led team", () => {
		expect(canEditTeamMember(ctx, member({ subDepartmentId: "sub_other" }))).toBe(false);
		expect(canEditTeamMember(ctx, member({ subDepartmentId: null }))).toBe(false);
	});

	test("rejects the leader themselves and deleted users", () => {
		expect(canEditTeamMember(ctx, member({ id: "leader_1" }))).toBe(false);
		expect(canEditTeamMember(ctx, member({ deletedAt: new Date() }))).toBe(false);
	});
});

describe("canAssignTeamMember", () => {
	test("allows moving an unassigned department member into a led team", () => {
		expect(canAssignTeamMember(ctx, member({ subDepartmentId: null }), "sub_led")).toBe(true);
	});

	test("allows moving between the leader's own teams", () => {
		expect(canAssignTeamMember(ctx, member({ subDepartmentId: "sub_led" }), "sub_led2")).toBe(true);
	});

	test("allows removing a member from a led team", () => {
		expect(canAssignTeamMember(ctx, member({ subDepartmentId: "sub_led" }), null)).toBe(true);
	});

	test("rejects assigning to a team the leader does not lead", () => {
		expect(canAssignTeamMember(ctx, member({ subDepartmentId: null }), "sub_other")).toBe(false);
	});

	test("rejects poaching a member out of a team led by someone else", () => {
		expect(canAssignTeamMember(ctx, member({ subDepartmentId: "sub_other" }), "sub_led")).toBe(
			false,
		);
	});

	test("rejects cross-department moves", () => {
		expect(
			canAssignTeamMember(
				ctx,
				member({ departmentId: "dept_other", subDepartmentId: null }),
				"sub_led",
			),
		).toBe(false);
	});

	test("rejects removing someone not in a led team", () => {
		expect(canAssignTeamMember(ctx, member({ subDepartmentId: "sub_other" }), null)).toBe(false);
	});

	test("rejects acting on the leader themselves", () => {
		expect(canAssignTeamMember(ctx, member({ id: "leader_1" }), "sub_led")).toBe(false);
	});
});
