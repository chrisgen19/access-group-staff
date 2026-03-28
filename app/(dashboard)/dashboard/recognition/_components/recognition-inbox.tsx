"use client";

import { useState } from "react";
import { Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecognitionFeed } from "./recognition-feed";

const TABS = [
	{
		key: "received" as const,
		label: "Received",
		icon: Inbox,
		emptyTitle: "No recognition cards received yet",
		emptyDescription:
			"When a colleague recognizes you, it will appear here.",
	},
	{
		key: "sent" as const,
		label: "Sent",
		icon: Send,
		emptyTitle: "You haven't sent any cards yet",
		emptyDescription: "Recognize a colleague to get started!",
	},
];

export function RecognitionInbox() {
	const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
	const currentTab = TABS.find((t) => t.key === activeTab)!;

	return (
		<>
			<div
				className="flex gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1 w-fit"
				role="tablist"
				aria-label="Recognition inbox"
			>
				{TABS.map((tab) => (
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

			<div role="tabpanel" className="max-w-3xl">
				<RecognitionFeed
					filter={activeTab}
					showTitle={false}
					emptyTitle={currentTab.emptyTitle}
					emptyDescription={currentTab.emptyDescription}
				/>
			</div>
		</>
	);
}
