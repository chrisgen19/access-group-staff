import { describe, expect, test } from "vitest";
import { groupUsersBySubDepartment, NO_SUB_DEPARTMENT_LABEL, type TeamMember } from "./team";

function member(id: string, subId: string | null, subName: string | null): TeamMember {
	return {
		id,
		firstName: id,
		lastName: "Test",
		displayName: null,
		position: null,
		avatar: null,
		image: null,
		email: `${id}@example.com`,
		branch: null,
		subDepartmentId: subId,
		subDepartment: subId && subName ? { id: subId, name: subName } : null,
	};
}

describe("groupUsersBySubDepartment", () => {
	test("groups members by sub-department", () => {
		const groups = groupUsersBySubDepartment(
			[
				member("a", "bi", "Team Power BI"),
				member("b", "infra", "Infrastructure"),
				member("c", "bi", "Team Power BI"),
			],
			null,
		);

		const bi = groups.find((g) => g.subDepartmentId === "bi");
		expect(bi?.members.map((m) => m.id)).toEqual(["a", "c"]);
		expect(groups.find((g) => g.subDepartmentId === "infra")?.members).toHaveLength(1);
	});

	test("puts the viewer's own sub-department first and flags it", () => {
		const groups = groupUsersBySubDepartment(
			[
				member("a", "alpha", "Alpha"),
				member("b", "infra", "Infrastructure"),
				member("c", "bi", "Team Power BI"),
			],
			"infra",
		);

		expect(groups[0].subDepartmentId).toBe("infra");
		expect(groups[0].isViewerTeam).toBe(true);
		expect(groups.filter((g) => g.isViewerTeam)).toHaveLength(1);
		// Remaining named groups stay alphabetical.
		expect(groups.slice(1).map((g) => g.name)).toEqual(["Alpha", "Team Power BI"]);
	});

	test("always sorts the 'No sub-department' bucket last", () => {
		const groups = groupUsersBySubDepartment(
			[member("a", null, null), member("b", "bi", "Team Power BI")],
			"bi",
		);

		expect(groups[0].subDepartmentId).toBe("bi");
		expect(groups.at(-1)?.subDepartmentId).toBeNull();
		expect(groups.at(-1)?.name).toBe(NO_SUB_DEPARTMENT_LABEL);
	});

	test("treats the 'No sub-department' bucket as the viewer's team when they have none", () => {
		const groups = groupUsersBySubDepartment(
			[member("a", "bi", "Team Power BI"), member("b", null, null)],
			null,
		);

		expect(groups[0].subDepartmentId).toBeNull();
		expect(groups[0].isViewerTeam).toBe(true);
	});
});
