import { prisma } from "@/lib/db";
import { type CardReactionUser, REACTION_EMOJIS } from "@/lib/recognition";

export async function getCardReactionSummary(cardId: string, userId?: string) {
	const [reactions, commentCount] = await Promise.all([
		prisma.cardReaction.findMany({
			where: { cardId },
			select: {
				emoji: true,
				userId: true,
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						avatar: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.cardComment.count({ where: { cardId } }),
	]);

	type Entry = { count: number; users: CardReactionUser[]; hasReacted: boolean };
	const byEmoji = new Map<string, Entry>();
	for (const r of reactions) {
		let entry = byEmoji.get(r.emoji);
		if (!entry) {
			entry = { count: 0, users: [], hasReacted: false };
			byEmoji.set(r.emoji, entry);
		}
		entry.count += 1;
		entry.users.push(r.user);
		if (userId && r.userId === userId) entry.hasReacted = true;
	}

	const publicReactions = REACTION_EMOJIS.map((emoji) => {
		const entry = byEmoji.get(emoji);
		return { emoji, count: entry?.count ?? 0 };
	}).filter((r) => r.count > 0);

	const initialReactions = publicReactions.map((r) => {
		const entry = byEmoji.get(r.emoji);
		return {
			...r,
			hasReacted: entry?.hasReacted ?? false,
			users: entry?.users ?? [],
		};
	});

	return { publicReactions, initialReactions, commentCount };
}
