export interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	displayName: string | null;
	position: string | null;
	avatar: string | null;
	image: string | null;
	email: string;
	subDepartmentId: string | null;
	subDepartment: { id: string; name: string } | null;
}

export interface TeamGroup {
	subDepartmentId: string | null;
	name: string;
	isViewerTeam: boolean;
	members: TeamMember[];
}

export const NO_SUB_DEPARTMENT_LABEL = "No sub-department";

/**
 * Groups department members by sub-department for the "My Team" view.
 *
 * Ordering: the viewer's own sub-department comes first, remaining named
 * sub-departments are sorted alphabetically, and the "No sub-department"
 * bucket is always last (unless the viewer themselves has no sub-department,
 * in which case that bucket is their team and leads).
 */
export function groupUsersBySubDepartment(
	users: TeamMember[],
	viewerSubDepartmentId: string | null,
): TeamGroup[] {
	const groups = new Map<string, TeamGroup>();

	for (const user of users) {
		const key = user.subDepartmentId ?? "__none__";
		let group = groups.get(key);
		if (!group) {
			group = {
				subDepartmentId: user.subDepartmentId,
				name: user.subDepartment?.name ?? NO_SUB_DEPARTMENT_LABEL,
				isViewerTeam: user.subDepartmentId === viewerSubDepartmentId,
				members: [],
			};
			groups.set(key, group);
		}
		group.members.push(user);
	}

	return [...groups.values()].sort((a, b) => {
		if (a.isViewerTeam !== b.isViewerTeam) return a.isViewerTeam ? -1 : 1;
		if (a.subDepartmentId === null) return 1;
		if (b.subDepartmentId === null) return -1;
		return a.name.localeCompare(b.name);
	});
}
