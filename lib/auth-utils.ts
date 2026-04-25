import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";

export class AuthError extends Error {
	readonly status: 401 | 403;
	constructor(message: string, status: 401 | 403) {
		super(message);
		this.name = "AuthError";
		this.status = status;
	}
}

export const getServerSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session;
});

export async function requireSession() {
	const session = await getServerSession();
	if (!session) {
		throw new AuthError("Unauthorized", 401);
	}
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { deletedAt: true },
	});
	if (!user || user.deletedAt !== null) {
		throw new AuthError("Account removed", 401);
	}
	return session;
}

export async function requireRole(minimumRole: "ADMIN" | "SUPERADMIN") {
	const session = await requireSession();
	if (!hasMinRole(session.user.role as Role, minimumRole)) {
		throw new AuthError("Forbidden", 403);
	}
	return session;
}

/**
 * Server Component variant of `requireRole` that redirects unauthenticated /
 * unauthorised users instead of throwing. Crucially, only `AuthError` is
 * treated as a redirect signal — every other exception (DB outage, transient
 * network glitch on the auth handler, programming bugs) is re-thrown so the
 * route's `error.tsx` boundary can surface it. The previous bare-`catch` +
 * `redirect("/dashboard")` pattern silently swallowed those, masking real
 * issues from observability.
 */
export async function requireRoleOrRedirect(
	minimumRole: "ADMIN" | "SUPERADMIN",
	redirectTo = "/dashboard",
) {
	try {
		return await requireRole(minimumRole);
	} catch (err) {
		if (err instanceof AuthError) {
			redirect(redirectTo);
		}
		throw err;
	}
}
