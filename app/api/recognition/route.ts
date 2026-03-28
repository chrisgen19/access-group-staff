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

		let where: object | undefined;
		if (filter === "received") {
			where = { recipientId: session.user.id };
		} else if (filter === "sent") {
			where = { senderId: session.user.id };
		} else if (filter === "department") {
			const user = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: { departmentId: true },
			});
			if (user?.departmentId) {
				where = {
					OR: [
						{ sender: { departmentId: user.departmentId } },
						{ recipient: { departmentId: user.departmentId } },
					],
				};
			}
		}

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
			take: 50,
		});

		return Response.json({ success: true, data: cards });
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
