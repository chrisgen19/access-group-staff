"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-utils";
import { createRecognitionCardSchema } from "@/lib/validations/recognition";
import { revalidatePath } from "next/cache";


export async function createRecognitionCardAction(formData: unknown) {
	try {
		const session = await requireSession();
		const parsed = createRecognitionCardSchema.safeParse(formData);

		if (!parsed.success) {
			return {
				success: false as const,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		const { date, recipientId, ...rest } = parsed.data;

		if (recipientId === session.user.id) {
			return {
				success: false as const,
				error: "You cannot send a recognition card to yourself",
			};
		}

		const recipient = await prisma.user.findUnique({
			where: { id: recipientId, isActive: true },
			select: { id: true },
		});

		if (!recipient) {
			return {
				success: false as const,
				error: "Recipient not found or inactive",
			};
		}

		const card = await prisma.$transaction(async (tx) => {
			const created = await tx.recognitionCard.create({
				data: {
					...rest,
					recipientId,
					senderId: session.user.id,
					date: new Date(`${date}T00:00:00`),
				},
			});

			await tx.notification.create({
				data: {
					userId: recipientId,
					type: "CARD_RECEIVED",
					message: `${session.user.name} sent you a recognition card`,
					cardId: created.id,
				},
			});

			return created;
		});

		revalidatePath("/dashboard/recognition");
		revalidatePath("/dashboard");
		return { success: true as const, data: card };
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to create recognition card";
		return { success: false as const, error: message };
	}
}

export async function updateRecognitionCardAction(cardId: string, formData: unknown) {
	try {
		const session = await requireSession();
		const parsed = createRecognitionCardSchema.safeParse(formData);

		if (!parsed.success) {
			return {
				success: false as const,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		const { date, recipientId, ...rest } = parsed.data;

		const existingCard = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { senderId: true, recipientId: true },
		});

		if (!existingCard || existingCard.senderId !== session.user.id) {
			return {
				success: false as const,
				error: "You can only edit cards you sent",
			};
		}

		if (recipientId === session.user.id) {
			return {
				success: false as const,
				error: "You cannot send a recognition card to yourself",
			};
		}

		const recipient = await prisma.user.findUnique({
			where: { id: recipientId, isActive: true },
			select: { id: true },
		});

		if (!recipient) {
			return {
				success: false as const,
				error: "Recipient not found or inactive",
			};
		}

		const recipientChanged = existingCard.recipientId !== recipientId;

		const card = await prisma.$transaction(async (tx) => {
			const updated = await tx.recognitionCard.update({
				where: { id: cardId },
				data: {
					...rest,
					recipientId,
					date: new Date(`${date}T00:00:00`),
				},
			});

			if (recipientChanged) {
				await tx.notification.deleteMany({
					where: { cardId, userId: existingCard.recipientId },
				});
			}

			await tx.notification.create({
				data: {
					userId: updated.recipientId,
					type: recipientChanged ? "CARD_RECEIVED" : "CARD_EDITED",
					message: recipientChanged
						? `${session.user.name} sent you a recognition card`
						: `${session.user.name} edited a recognition card sent to you`,
					cardId: updated.id,
				},
			});

			return updated;
		});

		revalidatePath("/dashboard/recognition");
		revalidatePath("/dashboard");
		revalidatePath(`/recognition/${cardId}`);
		return { success: true as const, data: card };
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to update recognition card";
		return { success: false as const, error: message };
	}
}

export async function deleteRecognitionCardAction(cardId: string) {
	try {
		const session = await requireSession();

		if (!session.user.role || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
			return { success: false as const, error: "Forbidden" };
		}

		const card = await prisma.recognitionCard.findUnique({
			where: { id: cardId },
			select: { id: true, senderId: true, recipientId: true },
		});

		if (!card) {
			return { success: false as const, error: "Card not found" };
		}

		const notifyUserIds = Array.from(
			new Set([card.senderId, card.recipientId].filter((id) => id !== session.user.id)),
		);

		await prisma.$transaction(async (tx) => {
			await tx.notification.deleteMany({ where: { cardId } });
			await tx.recognitionCard.delete({ where: { id: cardId } });
			if (notifyUserIds.length > 0) {
				await tx.notification.createMany({
					data: notifyUserIds.map((userId) => ({
						userId,
						type: "CARD_DELETED" as const,
						message:
							userId === card.senderId
								? "An admin deleted a recognition card you sent"
								: "An admin deleted a recognition card you received",
						cardId: null,
					})),
				});
			}
		});

		revalidatePath("/dashboard/recognition");
		revalidatePath("/dashboard");
		return { success: true as const };
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to delete recognition card";
		return { success: false as const, error: message };
	}
}

export async function getRecognitionCardsAction() {
	try {
		await requireSession();
		const cards = await prisma.recognitionCard.findMany({
			include: {
				sender: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						avatar: true,
						position: true,
					},
				},
				recipient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						avatar: true,
						position: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true as const, data: cards };
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to fetch recognition cards";
		return { success: false as const, error: message };
	}
}
