import { headers } from "next/headers";
import { cache } from "react";
import type { Role } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";

export const getServerSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session;
});

export async function requireSession() {
	const session = await getServerSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { deletedAt: true },
	});
	if (!user || user.deletedAt !== null) {
		throw new Error("Account removed");
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
