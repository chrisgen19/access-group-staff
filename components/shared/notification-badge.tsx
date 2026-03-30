"use client";

import { useQuery } from "@tanstack/react-query";

export function NotificationBadge() {
	const { data } = useQuery<{
		success: boolean;
		data: { unreadCount: number };
	}>({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications");
			if (!res.ok) throw new Error("Failed to fetch notifications");
			return res.json();
		},
		staleTime: 30_000,
	});

	const count = data?.data?.unreadCount ?? 0;

	if (count === 0) return null;

	return (
		<span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground tabular-nums">
			{count > 9 ? "9+" : count}
		</span>
	);
}
