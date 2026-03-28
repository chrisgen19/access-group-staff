import { auth } from "@/lib/auth";
import { hasMinRole } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma";
import { headers } from "next/headers";

export async function getServerSession() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session;
}

export async function requireSession() {
	const session = await getServerSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}

export async function requireRole(minimumRole: "ADMIN" | "SUPERADMIN") {
	const session = await requireSession();
	if (!hasMinRole(session.user.role as Role, minimumRole)) {
		throw new Error("Forbidden");
	}
	return session;
}
