"use client";

import { useQuery } from "@tanstack/react-query";

export function useUnreadCardIds() {
	const { data, ...rest } = useQuery<{
		success: boolean;
		data: string[];
	}>({
		queryKey: ["unread-card-ids"],
		queryFn: async () => {
			const res = await fetch("/api/notifications/unread-cards");
			if (!res.ok) throw new Error("Failed to fetch unread card IDs");
			return res.json();
		},
		staleTime: 30_000,
	});

	return {
		unreadCardIds: new Set(data?.data ?? []),
		...rest,
	};
}
