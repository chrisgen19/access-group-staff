import {
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getCurrentMonthBoundaries } from "@/lib/leaderboard/month";
import { maybeSnapshotPreviousMonth } from "@/lib/leaderboard/snapshot";
import { computeLeaderboardVisibility } from "@/lib/leaderboard/visibility";

export async function GET() {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	try {
		const userId = session.user.id;
		const now = new Date();
		const { start: startOfMonth, end: endOfMonth } = getCurrentMonthBoundaries(now);

		await maybeSnapshotPreviousMonth(now).catch(() => {
			// Snapshot failures must not break the stats response.
		});

		const [visibilitySettings, topLimit] = await Promise.all([
			getLeaderboardVisibilitySettings(),
			getTopRecognizedLimit(),
		]);
		const visibility = computeLeaderboardVisibility(visibilitySettings, now);

		const [sent, received, monthlyTotal] = await Promise.all([
			prisma.recognitionCard.count({
				where: { senderId: userId },
			}),
			prisma.recognitionCard.count({
				where: { recipientId: userId },
			}),
			prisma.recognitionCard.count({
				where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
			}),
		]);

		let topRecipients: Array<{
			firstName: string;
			lastName: string;
			avatar: string | null;
			count: number;
		}> = [];

		if (visibility.visible) {
			const grouped = await prisma.recognitionCard.groupBy({
				by: ["recipientId"],
				where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
				_count: { recipientId: true },
				orderBy: { _count: { recipientId: "desc" } },
				take: topLimit,
			});

			if (grouped.length > 0) {
				const recipients = await prisma.user.findMany({
					where: { id: { in: grouped.map((g) => g.recipientId) } },
					select: { id: true, firstName: true, lastName: true, avatar: true },
				});
				topRecipients = grouped.map((g) => {
					const user = recipients.find((u) => u.id === g.recipientId);
					return {
						firstName: user?.firstName ?? "",
						lastName: user?.lastName ?? "",
						avatar: user?.avatar ?? null,
						count: g._count.recipientId,
					};
				});
			}
		}

		return Response.json({
			success: true,
			data: {
				sent,
				received,
				monthlyTotal,
				topRecipients,
				leaderboardVisibility: {
					visible: visibility.visible,
					mode: visibility.mode,
					revealStart: visibility.revealStart?.toISOString() ?? null,
					revealEnd: visibility.revealEnd?.toISOString() ?? null,
				},
			},
		});
	} catch {
		return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
