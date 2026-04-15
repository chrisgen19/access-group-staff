import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getTopRecognizedLimit } from "@/lib/actions/settings-actions";

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
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const topLimit = await getTopRecognizedLimit();

		const [sent, received, monthlyTotal, topRecipientsRaw] =
			await Promise.all([
				prisma.recognitionCard.count({
					where: { senderId: userId },
				}),
				prisma.recognitionCard.count({
					where: { recipientId: userId },
				}),
				prisma.recognitionCard.count({
					where: { createdAt: { gte: startOfMonth } },
				}),
				prisma.recognitionCard.groupBy({
					by: ["recipientId"],
					_count: { recipientId: true },
					orderBy: { _count: { recipientId: "desc" } },
					take: topLimit,
				}),
			]);

		const recipientIds = topRecipientsRaw.map((r) => r.recipientId);
		const recipients = await prisma.user.findMany({
			where: { id: { in: recipientIds } },
			select: { id: true, firstName: true, lastName: true, avatar: true },
		});

		const topRecipients = topRecipientsRaw.map((r) => {
			const user = recipients.find((u) => u.id === r.recipientId);
			return {
				firstName: user?.firstName ?? "",
				lastName: user?.lastName ?? "",
				avatar: user?.avatar ?? null,
				count: r._count.recipientId,
			};
		});

		return Response.json({
			success: true,
			data: { sent, received, monthlyTotal, topRecipients },
		});
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
