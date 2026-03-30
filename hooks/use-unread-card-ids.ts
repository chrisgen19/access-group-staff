"use client";

import { useQuery } from "@tanstack/react-query";

const EMPTY_SET = new Set<string>();

export function useUnreadCardIds(enabled = true) {
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
		enabled,
	});

	return {
		unreadCardIds: enabled ? new Set(data?.data ?? []) : EMPTY_SET,
		...rest,
	};
}
