"use client";

import { useQuery } from "@tanstack/react-query";

interface Notification {
	id: string;
	type: "CARD_RECEIVED" | "CARD_EDITED" | "CARD_DELETED";
	message: string;
	isRead: boolean;
	createdAt: string;
	cardId: string | null;
}

interface NotificationsResponse {
	success: boolean;
	data: { notifications: Notification[]; unreadCount: number };
}

export type { Notification };

export function useNotifications() {
	const { data, ...rest } = useQuery<NotificationsResponse>({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications");
			if (!res.ok) throw new Error("Failed to fetch notifications");
			return res.json();
		},
		staleTime: 30_000,
	});

	return {
		notifications: data?.data?.notifications ?? [],
		unreadCount: data?.data?.unreadCount ?? 0,
		...rest,
	};
}
