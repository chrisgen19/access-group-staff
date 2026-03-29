import type { Role } from "@/app/generated/prisma/client";

export function getUserRole(session: { user: { role?: string | null } } | null): Role {
	return ((session?.user?.role as Role) ?? "STAFF");
}

const ROLE_HIERARCHY: Record<Role, number> = {
	STAFF: 0,
	ADMIN: 1,
	SUPERADMIN: 2,
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
	return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canViewUsers(role: Role): boolean {
	return hasMinRole(role, "ADMIN");
}

export function canManageUsers(role: Role): boolean {
	return hasMinRole(role, "ADMIN");
}

export function canManageDepartments(role: Role): boolean {
	return hasMinRole(role, "ADMIN");
}

export function canAssignAdminRole(role: Role): boolean {
	return hasMinRole(role, "SUPERADMIN");
}

export function canAssignRole(assignerRole: Role, targetRole: Role): boolean {
	if (targetRole === "SUPERADMIN") return false;
	if (targetRole === "ADMIN") return canAssignAdminRole(assignerRole);
	return hasMinRole(assignerRole, "ADMIN");
}
