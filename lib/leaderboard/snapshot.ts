import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { TOP_RECOGNIZED_MAX } from "./constants";
import { getMonthBoundariesForKey, getPreviousMonthKey } from "./month";

// Archive up to the maximum possible top-N so the snapshot is authoritative
// regardless of how admins change `top_recognized_limit` later. History
// consumers should trim to the current limit at display time.
const SNAPSHOT_TOP_N = TOP_RECOGNIZED_MAX;

// Remember the previous-month key we've already verified/written this process
// lifetime, so the hot path skips a DB round-trip on every stats fetch.
let resolvedMonthKey: string | null = null;

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
	if (resolvedMonthKey === prevKey) return;

	const existing = await prisma.monthlyLeaderboardSnapshot.findUnique({
		where: { month: prevKey },
		select: { id: true },
	});
	if (existing) {
		resolvedMonthKey = prevKey;
		return;
	}

	const recipients = await computeMonthRecipients(prevKey, SNAPSHOT_TOP_N);
	if (recipients.length === 0) {
		// No data to archive — mark resolved so we don't re-query every request.
		resolvedMonthKey = prevKey;
		return;
	}

	await prisma.monthlyLeaderboardSnapshot.upsert({
		where: { month: prevKey },
		create: {
			month: prevKey,
			recipients: recipients as unknown as Prisma.InputJsonValue,
			topLimit: SNAPSHOT_TOP_N,
		},
		update: {},
	});
	resolvedMonthKey = prevKey;
}
