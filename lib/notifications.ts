import { prisma } from "@/lib/db";
import type { NotificationType } from "@/app/generated/prisma/client";

export async function createNotification(params: {
	userId: string;
	type: NotificationType;
	message: string;
	cardId?: string | null;
}) {
	return prisma.notification.create({
		data: {
			userId: params.userId,
			type: params.type,
			message: params.message,
			cardId: params.cardId ?? null,
		},
	});
}
