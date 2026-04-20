"use server";

import { z } from "zod";
import type { Role } from "@/app/generated/prisma/client";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";
import { REACTION_EMOJIS } from "@/lib/recognition";

const reactionSchema = z.object({
	cardId: z.string().min(1),
	emoji: z.string().refine((e) => (REACTION_EMOJIS as readonly string[]).includes(e), {
		message: "Invalid emoji",
	}),
});

const commentBodySchema = z
	.string()
	.min(1, "Comment cannot be empty")
	.max(500, "Comment cannot exceed 500 characters")
	.trim();

function interactionRecipients(card: { senderId: string; recipientId: string }, actorId: string) {
	return Array.from(new Set([card.senderId, card.recipientId].filter((id) => id !== actorId)));
}

export async function toggleReactionAction(cardId: string, emoji: string) {
	try {
		const session = await requireSession();
		const parsed = reactionSchema.safeParse({ cardId, emoji });
		if (!parsed.success) {
			return { success: false as const, error: "Invalid input" };
		}

		const card = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { id: true, senderId: true, recipientId: true },
		});
		if (!card) {
			return { success: false as const, error: "Card not found" };
		}

		const deleted = await prisma.cardReaction.deleteMany({
			where: { cardId, userId: session.user.id, emoji },
		});

		if (deleted.count > 0) {
			return { success: true as const, action: "removed" as const };
		}

		try {
			// Create + notify in one txn so the reaction and its notification are
			// committed atomically. No window where we notify for a reaction that
			// doesn't exist, and P2002 from a concurrent add rolls back cleanly.
			await prisma.$transaction(async (tx) => {
				await tx.cardReaction.create({
					data: { cardId, userId: session.user.id, emoji },
				});
				const recipients = interactionRecipients(card, session.user.id);
				if (recipients.length > 0) {
					await tx.notification.createMany({
						data: recipients.map((userId) => ({
							userId,
							type: "CARD_REACTION" as const,
							message:
								`${session.user.name ?? "Someone"} reacted ${emoji} to a recognition card`.trim(),
							cardId: card.id,
						})),
					});
				}
			});
			return { success: true as const, action: "added" as const };
		} catch (err) {
			// A concurrent add already created the row — our click flips to remove.
			if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") {
				await prisma.cardReaction.deleteMany({
					where: { cardId, userId: session.user.id, emoji },
				});
				return { success: true as const, action: "removed" as const };
			}
			throw err;
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to update reaction";
		return { success: false as const, error: message };
	}
}

export async function addCommentAction(cardId: string, body: string) {
	try {
		const session = await requireSession();
		const parsedBody = commentBodySchema.safeParse(body);
		if (!parsedBody.success) {
			return { success: false as const, error: parsedBody.error.issues[0].message };
		}

		const card = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { id: true, senderId: true, recipientId: true },
		});
		if (!card) {
			return { success: false as const, error: "Card not found" };
		}

		const comment = await prisma.$transaction(async (tx) => {
			const created = await tx.cardComment.create({
				data: { cardId, userId: session.user.id, body: parsedBody.data },
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
			});

			const recipients = interactionRecipients(card, session.user.id);
			if (recipients.length > 0) {
				await tx.notification.createMany({
					data: recipients.map((userId) => ({
						userId,
						type: "CARD_COMMENT" as const,
						message: `${session.user.name ?? "Someone"} commented on a recognition card`,
						cardId: card.id,
					})),
				});
			}

			return created;
		});

		return { success: true as const, data: comment };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to add comment";
		return { success: false as const, error: message };
	}
}

export async function editCommentAction(commentId: string, body: string) {
	try {
		const session = await requireSession();
		const parsedBody = commentBodySchema.safeParse(body);
		if (!parsedBody.success) {
			return { success: false as const, error: parsedBody.error.issues[0].message };
		}

		const comment = await prisma.cardComment.findUnique({
			where: { id: commentId },
			select: { userId: true },
		});

		if (!comment) {
			return { success: false as const, error: "Comment not found" };
		}

		if (comment.userId !== session.user.id) {
			return { success: false as const, error: "You can only edit your own comments" };
		}

		const updated = await prisma.cardComment.update({
			where: { id: commentId },
			data: { body: parsedBody.data },
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
		});

		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to edit comment";
		return { success: false as const, error: message };
	}
}

export async function deleteCommentAction(commentId: string) {
	try {
		const session = await requireSession();

		const comment = await prisma.cardComment.findUnique({
			where: { id: commentId },
			select: { userId: true },
		});

		if (!comment) {
			return { success: false as const, error: "Comment not found" };
		}

		const isAdmin = hasMinRole(session.user.role as Role, "ADMIN");
		if (comment.userId !== session.user.id && !isAdmin) {
			return { success: false as const, error: "Not allowed" };
		}

		await prisma.cardComment.delete({ where: { id: commentId } });
		return { success: true as const };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to delete comment";
		return { success: false as const, error: message };
	}
}
