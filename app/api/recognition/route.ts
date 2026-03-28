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

	const cards = await prisma.recognitionCard.findMany({
		include: {
			sender: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					position: true,
				},
			},
			recipient: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					position: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return Response.json({ success: true, data: cards });
}
