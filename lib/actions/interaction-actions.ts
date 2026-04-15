"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-utils";
import { hasMinRole } from "@/lib/permissions";
import { REACTION_EMOJIS } from "@/lib/recognition";
import type { Role } from "@/app/generated/prisma/client";
import { z } from "zod";

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

export async function toggleReactionAction(cardId: string, emoji: string) {
	try {
		const session = await requireSession();
		const parsed = reactionSchema.safeParse({ cardId, emoji });
		if (!parsed.success) {
			return { success: false as const, error: "Invalid input" };
		}

		const card = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { id: true },
		});
		if (!card) {
			return { success: false as const, error: "Card not found" };
		}

		const existing = await prisma.cardReaction.findUnique({
			where: {
				cardId_userId_emoji: {
					cardId,
					userId: session.user.id,
					emoji,
				},
			},
		});

		if (existing) {
			await prisma.cardReaction.delete({ where: { id: existing.id } });
			return { success: true as const, action: "removed" as const };
		}

		await prisma.cardReaction.create({
			data: { cardId, userId: session.user.id, emoji },
		});
		return { success: true as const, action: "added" as const };
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
			select: { id: true },
		});
		if (!card) {
			return { success: false as const, error: "Card not found" };
		}

		const comment = await prisma.cardComment.create({
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
