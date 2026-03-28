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

		const card = await prisma.recognitionCard.create({
			data: {
				...rest,
				recipientId,
				senderId: session.user.id,
				date: new Date(`${date}T00:00:00`),
			},
		});

		revalidatePath("/dashboard/recognition");
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
			select: { senderId: true },
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

		const card = await prisma.recognitionCard.update({
			where: { id: cardId },
			data: {
				...rest,
				recipientId,
				date: new Date(`${date}T00:00:00`),
			},
		});

		revalidatePath("/dashboard/recognition");
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
