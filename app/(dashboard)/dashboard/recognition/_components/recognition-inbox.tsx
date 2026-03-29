"use client";

import { useState } from "react";
import { Inbox, Send, LayoutList } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { hasMinRole } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma/client";
import { RecognitionFeed } from "./recognition-feed";
import { RecognitionTable } from "./recognition-table";
import { ShareDialog } from "./share-dialog";

type TabKey = "all" | "received" | "sent";

const TABS: {
	key: TabKey;
	label: string;
	icon: typeof Inbox;
	adminOnly?: boolean;
	emptyTitle: string;
	emptyDescription: string;
}[] = [
	{
		key: "all",
		label: "All",
		icon: LayoutList,
		adminOnly: true,
		emptyTitle: "No recognition cards yet",
		emptyDescription: "No one has sent a recognition card yet.",
	},
	{
		key: "received",
		label: "Received",
		icon: Inbox,
		emptyTitle: "No recognition cards received yet",
		emptyDescription:
			"When a colleague recognizes you, it will appear here.",
	},
	{
		key: "sent",
		label: "Sent",
		icon: Send,
		emptyTitle: "You haven't sent any cards yet",
		emptyDescription: "Recognize a colleague to get started!",
	},
];

export function RecognitionInbox() {
	const { data: session } = useSession();
	const userRole = (session?.user?.role as Role) ?? "STAFF";
	const isAdmin = hasMinRole(userRole, "ADMIN");
	const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);
	const defaultTab = isAdmin ? "all" : "received";

	const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
	const [shareCardId, setShareCardId] = useState<string | null>(null);
	const currentTab = visibleTabs.find((t) => t.key === activeTab)!;

	return (
		<>
			<div
				className="flex gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1 w-fit"
				role="tablist"
				aria-label="Recognition inbox"
			>
				{visibleTabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={cn(
							"inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200",
							activeTab === tab.key
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<tab.icon size={16} />
						{tab.label}
					</button>
				))}
			</div>

			<div role="tabpanel">
				{activeTab === "all" ? (
					<RecognitionTable onShare={setShareCardId} />
				) : (
					<RecognitionFeed
						cardMaxWidth="max-w-3xl"
						filter={activeTab}
						showTitle={false}
						showActions
						currentUserId={session?.user?.id}
						emptyTitle={currentTab.emptyTitle}
						emptyDescription={currentTab.emptyDescription}
						onShare={setShareCardId}
					/>
				)}
			</div>

			<ShareDialog
				open={!!shareCardId}
				cardId={shareCardId}
				onClose={() => setShareCardId(null)}
				redirectOnClose={false}
			/>
		</>
	);
}
