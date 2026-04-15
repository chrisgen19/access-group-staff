import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/auth-utils";
import { REACTION_EMOJIS } from "@/lib/recognition";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ cardId: string }> },
) {
	try {
		const session = await getServerSession();
		if (!session) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { cardId } = await params;

		const card = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { id: true },
		});

		if (!card) {
			return NextResponse.json(
				{ success: false, error: "Card not found" },
				{ status: 404 },
			);
		}

		const [allReactions, comments] = await Promise.all([
			prisma.cardReaction.findMany({
				where: { cardId },
				select: { emoji: true, userId: true },
			}),
			prisma.cardComment.findMany({
				where: { cardId },
				select: {
					id: true,
					body: true,
					createdAt: true,
					updatedAt: true,
					userId: true,
					user: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							avatar: true,
							position: true,
						},
					},
				},
				orderBy: { createdAt: "asc" },
			}),
		]);

		const reactionMap = new Map<string, { count: number; hasReacted: boolean }>();
		for (const emoji of REACTION_EMOJIS) {
			reactionMap.set(emoji, { count: 0, hasReacted: false });
		}
		for (const r of allReactions) {
			const entry = reactionMap.get(r.emoji);
			if (entry) {
				entry.count += 1;
				if (r.userId === session.user.id) entry.hasReacted = true;
			}
		}

		const reactions = Array.from(reactionMap.entries()).map(
			([emoji, { count, hasReacted }]) => ({ emoji, count, hasReacted }),
		);

		return NextResponse.json({
			success: true,
			data: {
				reactions,
				comments,
				totalComments: comments.length,
			},
		});
	} catch {
		return NextResponse.json(
			{ success: false, error: "Failed to fetch interactions" },
			{ status: 500 },
		);
	}
}
