import type { Role } from "@/app/generated/prisma/client";
import { AuthError, requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";

export async function GET() {
	try {
		const session = await requireSession();
		if (!canViewUsers(session.user.role as Role)) {
			return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
		}

		const [activeCount, deletedCount] = await Promise.all([
			prisma.user.count({ where: { deletedAt: null } }),
			prisma.user.count({ where: { deletedAt: { not: null } } }),
		]);

		return Response.json({ success: true, data: { activeCount, deletedCount } });
	} catch (error) {
		if (error instanceof AuthError) {
			return Response.json({ success: false, error: error.message }, { status: error.status });
		}
		return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
