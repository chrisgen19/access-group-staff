"use client";

import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBadge() {
	const { unreadCount } = useNotifications();

	if (unreadCount === 0) return null;

	return (
		<span className="ml-auto shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground tabular-nums">
			{unreadCount > 9 ? "9+" : unreadCount}
		</span>
	);
}
