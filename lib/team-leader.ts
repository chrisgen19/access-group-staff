import type { Role } from "@/app/generated/prisma/client";

export interface LeaderContext {
	userId: string;
	departmentId: string | null;
	ledSubDepartmentIds: string[];
}

export interface TeamMemberRef {
	id: string;
	role: Role;
	departmentId: string | null;
	subDepartmentId: string | null;
	/** Whether the target leads at least one sub-department. */
	isLeader: boolean;
	deletedAt: Date | null;
}

/** True when the user leads at least one sub-department. */
export function isTeamLeader(ctx: LeaderContext): boolean {
	return ctx.ledSubDepartmentIds.length > 0;
}

/**
 * Shared eligibility rules for a leader acting on a member. A leader may only
 * touch an active STAFF user who is not themselves a leader and not the leader
 * themselves. Specific actions add their own scope (current team / destination).
 */
function isActionableTarget(ctx: LeaderContext, target: TeamMemberRef): boolean {
	if (target.deletedAt !== null) return false;
	if (target.id === ctx.userId) return false;
	if (target.role !== "STAFF") return false;
	if (target.isLeader) return false;
	return true;
}

/**
 * Can the leader view/edit this member's limited fields? The member must
 * currently belong to a sub-department the leader leads.
 */
export function canEditTeamMember(ctx: LeaderContext, target: TeamMemberRef): boolean {
	if (!isActionableTarget(ctx, target)) return false;
	if (target.subDepartmentId === null) return false;
	return ctx.ledSubDepartmentIds.includes(target.subDepartmentId);
}

/**
 * Can the leader assign this member to `destSubDepartmentId` (or `null` to
 * remove from their team)?
 *
 * - Never crosses departments — the target must already be in the leader's
 *   department (moving a user's department is admin-only).
 * - Removing requires the member currently be in one of the leader's teams.
 * - Assigning requires the destination be one of the leader's teams, and the
 *   member's current team be unassigned or one the leader leads (so a leader
 *   can't poach someone out of a team led by someone else).
 */
export function canAssignTeamMember(
	ctx: LeaderContext,
	target: TeamMemberRef,
	destSubDepartmentId: string | null,
): boolean {
	if (!isActionableTarget(ctx, target)) return false;
	if (ctx.departmentId === null) return false;
	if (target.departmentId !== ctx.departmentId) return false;

	if (destSubDepartmentId === null) {
		return (
			target.subDepartmentId !== null && ctx.ledSubDepartmentIds.includes(target.subDepartmentId)
		);
	}

	if (!ctx.ledSubDepartmentIds.includes(destSubDepartmentId)) return false;
	return (
		target.subDepartmentId === null || ctx.ledSubDepartmentIds.includes(target.subDepartmentId)
	);
}
