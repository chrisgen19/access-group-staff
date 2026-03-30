"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string) {
	try {
		const session = await requireSession();

		await prisma.notification.updateMany({
			where: {
				id: notificationId,
				userId: session.user.id,
			},
			data: { isRead: true },
		});

		revalidatePath("/dashboard");
		return { success: true as const };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to mark notification as read";
		return { success: false as const, error: message };
	}
}

export async function markAllNotificationsReadAction() {
	try {
		const session = await requireSession();

		await prisma.notification.updateMany({
			where: {
				userId: session.user.id,
				isRead: false,
			},
			data: { isRead: true },
		});

		revalidatePath("/dashboard");
		return { success: true as const };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to mark notifications as read";
		return { success: false as const, error: message };
	}
}

export async function markNotificationsReadByCardAction(cardId: string) {
	try {
		const session = await requireSession();

		await prisma.notification.updateMany({
			where: {
				userId: session.user.id,
				cardId,
				isRead: false,
			},
			data: { isRead: true },
		});

		revalidatePath("/dashboard");
		return { success: true as const };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to mark notifications as read";
		return { success: false as const, error: message };
	}
}
