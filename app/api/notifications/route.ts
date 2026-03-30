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
		const userId = session.user.id;

		const [notifications, unreadCount] = await Promise.all([
			prisma.notification.findMany({
				where: { userId },
				orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
				take: 20,
				select: {
					id: true,
					type: true,
					message: true,
					isRead: true,
					createdAt: true,
					cardId: true,
				},
			}),
			prisma.notification.count({
				where: { userId, isRead: false },
			}),
		]);

		return Response.json({
			success: true,
			data: { notifications, unreadCount },
		});
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
