import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma/client";
import { headers } from "next/headers";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session || !canViewUsers(session.user.role as Role)) {
		return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
	}

	const users = await prisma.user.findMany({
		include: { department: true },
		orderBy: { createdAt: "desc" },
	});

	return Response.json({ success: true, data: users });
}
