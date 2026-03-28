import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return Response.json(
			{ success: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	const users = await prisma.user.findMany({
		where: { isActive: true },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			position: true,
		},
		orderBy: { firstName: "asc" },
	});

	return Response.json({ success: true, data: users });
}
