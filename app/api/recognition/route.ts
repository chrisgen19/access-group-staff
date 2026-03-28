import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		return Response.json(
			{ success: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	try {
		const filter = request.nextUrl.searchParams.get("filter");
		const where =
			filter === "received"
				? { recipientId: session.user.id }
				: filter === "sent"
					? { senderId: session.user.id }
					: undefined;

		const cards = await prisma.recognitionCard.findMany({
			where,
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
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
