import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
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
		const notifications = await prisma.notification.findMany({
			where: {
				userId: session.user.id,
				type: "CARD_RECEIVED",
				isRead: false,
				cardId: { not: null },
			},
			select: { cardId: true },
		});

		const cardIds = notifications.map((n) => n.cardId as string);

		return Response.json({ success: true, data: cardIds });
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
