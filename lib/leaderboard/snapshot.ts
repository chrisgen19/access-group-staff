import type { Prisma } from "@/app/generated/prisma/client";
import { getTopRecognizedLimit } from "@/lib/actions/settings-actions";
import { prisma } from "@/lib/db";
import { getMonthBoundariesForKey, getPreviousMonthKey } from "./month";

export interface SnapshotRecipient {
	userId: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	count: number;
	rank: number;
}

export async function computeMonthRecipients(
	monthKey: string,
	topLimit: number,
): Promise<SnapshotRecipient[]> {
	const { start, end } = getMonthBoundariesForKey(monthKey);

	const grouped = await prisma.recognitionCard.groupBy({
		by: ["recipientId"],
		where: { createdAt: { gte: start, lt: end } },
		_count: { recipientId: true },
		orderBy: { _count: { recipientId: "desc" } },
		take: topLimit,
	});

	if (grouped.length === 0) return [];

	const users = await prisma.user.findMany({
		where: { id: { in: grouped.map((g) => g.recipientId) } },
		select: { id: true, firstName: true, lastName: true, avatar: true },
	});

	return grouped.map((g, index) => {
		const user = users.find((u) => u.id === g.recipientId);
		return {
			userId: g.recipientId,
			firstName: user?.firstName ?? "",
			lastName: user?.lastName ?? "",
			avatar: user?.avatar ?? null,
			count: g._count.recipientId,
			rank: index + 1,
		};
	});
}

export async function maybeSnapshotPreviousMonth(now: Date = new Date()): Promise<void> {
	const prevKey = getPreviousMonthKey(now);

	const existing = await prisma.monthlyLeaderboardSnapshot.findUnique({
		where: { month: prevKey },
		select: { id: true },
	});
	if (existing) return;

	const topLimit = await getTopRecognizedLimit();
	const recipients = await computeMonthRecipients(prevKey, topLimit);
	if (recipients.length === 0) return;

	await prisma.monthlyLeaderboardSnapshot.upsert({
		where: { month: prevKey },
		create: {
			month: prevKey,
			recipients: recipients as unknown as Prisma.InputJsonValue,
			topLimit,
		},
		update: {},
	});
}
