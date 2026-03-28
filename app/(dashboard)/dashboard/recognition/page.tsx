"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecognitionFeed } from "./_components/recognition-feed";

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

export default function RecognitionPage() {
	const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
	const currentTab = TABS.find((t) => t.key === activeTab)!;

	return (
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						Recognition Card
					</h1>
					<p className="mt-2 text-base text-muted-foreground">
						Your personal recognition inbox.
					</p>
				</div>
				<Link
					href="/dashboard/recognition/create"
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					Send Recognition Card
				</Link>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1 w-fit">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
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

			{/* Feed */}
			<RecognitionFeed
				filter={activeTab}
				showTitle={false}
				emptyTitle={currentTab.emptyTitle}
				emptyDescription={currentTab.emptyDescription}
			/>
		</div>
	);
}
