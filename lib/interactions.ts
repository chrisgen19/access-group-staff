import { prisma } from "@/lib/db";
import { REACTION_EMOJIS } from "@/lib/recognition";

export async function getCardReactionSummary(
	cardId: string,
	userId?: string,
) {
	const [reactionCounts, userReactions, commentCount] = await Promise.all([
		prisma.cardReaction.groupBy({
			by: ["emoji"],
			where: { cardId },
			_count: true,
		}),
		userId
			? prisma.cardReaction.findMany({
					where: { cardId, userId },
					select: { emoji: true },
				})
			: Promise.resolve([]),
		prisma.cardComment.count({ where: { cardId } }),
	]);

	const userReactionSet = new Set(userReactions.map((r) => r.emoji));
	const reactionMap = new Map(
		reactionCounts.map((r) => [r.emoji, r._count]),
	);

	const publicReactions = REACTION_EMOJIS.map((emoji) => ({
		emoji,
		count: reactionMap.get(emoji) ?? 0,
	})).filter((r) => r.count > 0);

	const initialReactions = publicReactions.map((r) => ({
		...r,
		hasReacted: userReactionSet.has(r.emoji),
	}));

	return { publicReactions, initialReactions, commentCount };
}
