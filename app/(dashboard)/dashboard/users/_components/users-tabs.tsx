"use client";

import { Trash2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface UsersTabsProps {
	activeCount: number;
	deletedCount: number;
}

export function UsersTabs({ activeCount, deletedCount }: UsersTabsProps) {
	const pathname = usePathname();

	const tabs = [
		{
			key: "active",
			label: "Active",
			href: "/dashboard/users",
			icon: Users,
			count: activeCount,
		},
		{
			key: "deleted",
			label: "Deleted",
			href: "/dashboard/users/deleted",
			icon: Trash2,
			count: deletedCount,
		},
	];

	return (
		<div
			className="flex gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1 w-fit"
			role="tablist"
			aria-label="Staff directory"
		>
			{tabs.map((tab) => {
				const isActive = pathname === tab.href;
				const Icon = tab.icon;
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
						<Icon size={16} />
						{tab.label}
						<span
							className={cn(
								"inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-medium",
								isActive
									? "bg-primary/10 text-primary"
									: "bg-gray-200/70 dark:bg-white/10 text-muted-foreground",
							)}
						>
							{tab.count}
						</span>
					</Link>
				);
			})}
		</div>
	);
}
