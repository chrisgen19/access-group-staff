import { headers } from "next/headers";
import type { Role } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session || !canViewUsers(session.user.role as Role)) {
		return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
	}

	const [activeCount, deletedCount] = await Promise.all([
		prisma.user.count({ where: { deletedAt: null } }),
		prisma.user.count({ where: { deletedAt: { not: null } } }),
	]);

	return Response.json({ success: true, data: { activeCount, deletedCount } });
}
