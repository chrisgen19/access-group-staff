"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Heart, MessageCircle, Pencil, Smile, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Notification, useNotifications } from "@/hooks/use-notifications";
import {
	markAllNotificationsReadAction,
	markNotificationReadAction,
} from "@/lib/actions/notification-actions";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateString: string) {
	const now = Date.now();
	const date = new Date(dateString).getTime();
	const diffMs = now - date;
	const diffMin = Math.floor(diffMs / 60_000);
	const diffHr = Math.floor(diffMs / 3_600_000);
	const diffDay = Math.floor(diffMs / 86_400_000);

	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHr < 24) return `${diffHr}h ago`;
	if (diffDay < 7) return `${diffDay}d ago`;
	return new Date(dateString).toLocaleDateString();
}

function notificationIcon(type: Notification["type"]) {
	switch (type) {
		case "CARD_RECEIVED":
			return <Heart size={14} className="text-primary" />;
		case "CARD_EDITED":
			return <Pencil size={14} className="text-blue-500" />;
		case "CARD_DELETED":
			return <Trash2 size={14} className="text-destructive" />;
		case "CARD_REACTION":
			return <Smile size={14} className="text-amber-500" />;
		case "CARD_COMMENT":
			return <MessageCircle size={14} className="text-blue-500" />;
	}
}

export function NotificationBell() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { notifications, unreadCount } = useNotifications();

	async function handleMarkAllRead() {
		await markAllNotificationsReadAction();
		queryClient.invalidateQueries({ queryKey: ["notifications"] });
		queryClient.invalidateQueries({ queryKey: ["unread-card-ids"] });
	}

	function handleNotificationClick(notification: Notification) {
		if (!notification.isRead) {
			markNotificationReadAction(notification.id).then(() => {
				queryClient.invalidateQueries({ queryKey: ["notifications"] });
				queryClient.invalidateQueries({ queryKey: ["unread-card-ids"] });
			});
		}
		if (notification.cardId) {
			const params = new URLSearchParams();
			if (notification.type === "CARD_COMMENT") params.set("focus", "comments");
			// Nonce: guarantees the URL changes per click so repeated notifications
			// for the same card still trigger navigation and re-open the thread.
			params.set("n", notification.id);
			router.push(`/dashboard/recognition/${notification.cardId}?${params.toString()}`);
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors outline-none cursor-pointer">
				<Bell size={20} />
				{unreadCount > 0 && (
					<span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden">
				<div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-4 py-3">
					<span className="text-sm font-semibold text-foreground">Notifications</span>
					{unreadCount > 0 && (
						<button
							type="button"
							onClick={handleMarkAllRead}
							className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
						>
							<CheckCheck size={14} />
							Mark all as read
						</button>
					)}
				</div>

				<div className="max-h-80 overflow-y-auto">
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
							<Bell size={28} className="mb-2 opacity-30" />
							<p className="text-sm">No notifications yet</p>
						</div>
					) : (
						notifications.map((notification) => (
							<DropdownMenuItem
								key={notification.id}
								onClick={() => handleNotificationClick(notification)}
								className={cn(
									"flex w-full items-start gap-3 px-4 py-3 text-left transition-colors rounded-none cursor-pointer",
									!notification.isRead && "bg-primary/5",
								)}
							>
								<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
									{notificationIcon(notification.type)}
								</div>
								<div className="flex-1 min-w-0">
									<p
										className={cn(
											"text-sm leading-snug",
											notification.isRead ? "text-muted-foreground" : "text-foreground font-medium",
										)}
									>
										{notification.message}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{formatRelativeTime(notification.createdAt)}
									</p>
								</div>
								{!notification.isRead && (
									<span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
								)}
							</DropdownMenuItem>
						))
					)}
				</div>

				{notifications.length > 0 && (
					<div className="border-t border-gray-200 dark:border-white/10">
						<DropdownMenuItem
							onClick={() => router.push("/dashboard/recognition")}
							className="w-full justify-center rounded-none px-4 py-2.5 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer"
						>
							View all
						</DropdownMenuItem>
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
