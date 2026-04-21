import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { REACTION_EMOJIS } from "@/lib/recognition";

export async function GET(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { cardId } = await params;

		const card = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { id: true },
		});

		if (!card) {
			return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
		}

		const [allReactions, comments] = await Promise.all([
			prisma.cardReaction.findMany({
				where: { cardId },
				select: {
					emoji: true,
					userId: true,
					createdAt: true,
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

		type ReactorEntry = {
			count: number;
			hasReacted: boolean;
			users: {
				id: string;
				firstName: string;
				lastName: string;
				avatar: string | null;
			}[];
		};
		const reactionMap = new Map<string, ReactorEntry>();
		for (const emoji of REACTION_EMOJIS) {
			reactionMap.set(emoji, { count: 0, hasReacted: false, users: [] });
		}
		for (const r of allReactions) {
			const entry = reactionMap.get(r.emoji);
			if (entry) {
				entry.count += 1;
				entry.users.push(r.user);
				if (r.userId === session.user.id) entry.hasReacted = true;
			}
		}

		const reactions = Array.from(reactionMap.entries()).map(
			([emoji, { count, hasReacted, users }]) => ({
				emoji,
				count,
				hasReacted,
				users,
			}),
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
