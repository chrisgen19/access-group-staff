"use client";

import { Building2, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RecognitionFeed } from "../recognition/_components/recognition-feed";

const FEED_TABS = [
	{
		key: "all" as const,
		label: "Public",
		icon: Globe,
		emptyTitle: "No recognition cards yet",
		emptyDescription: "Be the first to recognize a colleague!",
	},
	{
		key: "department" as const,
		label: "My Department",
		icon: Building2,
		emptyTitle: "No department recognitions yet",
		emptyDescription: "Recognition cards involving your department will appear here.",
	},
];

interface RecognitionFeedWidgetProps {
	currentUserId: string;
	isAdmin: boolean;
}

export function RecognitionFeedWidget({ currentUserId, isAdmin }: RecognitionFeedWidgetProps) {
	const [activeTab, setActiveTab] = useState<"all" | "department">("all");
	const currentTab = FEED_TABS.find((t) => t.key === activeTab) ?? FEED_TABS[0];

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
			<div className="px-6 pt-6 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
					Recognition Feed
				</h3>
				<div
					className="flex gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1 w-fit"
					role="tablist"
					aria-label="Recognition feed filter"
				>
					{FEED_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							role="tab"
							aria-selected={activeTab === tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
								activeTab === tab.key
									? "bg-card text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<tab.icon size={14} />
							{tab.label}
						</button>
					))}
				</div>
			</div>
			<div className="px-6 pb-6" role="tabpanel">
				<RecognitionFeed
					filter={activeTab}
					showTitle={false}
					currentUserId={currentUserId}
					isAdmin={isAdmin}
					emptyTitle={currentTab.emptyTitle}
					emptyDescription={currentTab.emptyDescription}
					limit={10}
					infinite
				/>
			</div>
		</div>
	);
}
