"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox, LayoutList, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
	LayoutList,
	Inbox,
	Send,
};

export interface TabItem {
	key: string;
	label: string;
	href: string;
	icon: keyof typeof ICON_MAP;
}

interface RecognitionTabsProps {
	tabs: TabItem[];
}

export function RecognitionTabs({ tabs }: RecognitionTabsProps) {
	const pathname = usePathname();

	return (
		<div
			className="flex gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1 w-fit"
			role="tablist"
			aria-label="Recognition inbox"
		>
			{tabs.map((tab) => {
				const isActive = pathname === tab.href;
				const Icon = ICON_MAP[tab.icon];
				return (
					<Link
						key={tab.key}
						href={tab.href}
						role="tab"
						aria-selected={isActive}
						className={cn(
							"inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200",
							isActive
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{Icon && <Icon size={16} />}
						{tab.label}
					</Link>
				);
			})}
		</div>
	);
}
