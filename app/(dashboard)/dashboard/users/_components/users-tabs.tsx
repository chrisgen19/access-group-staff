"use client";

import { useQuery } from "@tanstack/react-query";
import { Trash2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface UsersTabsProps {
	activeCount: number;
	deletedCount: number;
}

interface CountsResponse {
	success: boolean;
	data: { activeCount: number; deletedCount: number };
}

export function UsersTabs({ activeCount, deletedCount }: UsersTabsProps) {
	const pathname = usePathname();

	const { data } = useQuery<CountsResponse>({
		queryKey: ["users", "counts"],
		queryFn: async () => {
			const res = await fetch("/api/users/counts");
			if (!res.ok) throw new Error("Failed to fetch counts");
			return res.json();
		},
		initialData: {
			success: true,
			data: { activeCount, deletedCount },
		},
		staleTime: 30_000,
	});

	const counts = data.data;

	const tabs = [
		{
			key: "active",
			label: "Active",
			href: "/dashboard/users",
			icon: Users,
			count: counts.activeCount,
		},
		{
			key: "deleted",
			label: "Deleted",
			href: "/dashboard/users/deleted",
			icon: Trash2,
			count: counts.deletedCount,
		},
	];

	return (
		<div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			<div
				className="flex min-w-max gap-1 rounded-[1.6rem] border border-black/5 bg-gray-100/80 p-1.5 dark:border-white/10 dark:bg-white/5"
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
								"inline-flex min-h-11 items-center gap-2 rounded-[1.2rem] px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
								isActive
									? "bg-card text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon size={16} />
							{tab.label}
							<span
								className={cn(
									"inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-medium",
									isActive
										? "bg-primary/10 text-primary"
										: "bg-gray-200/70 text-muted-foreground dark:bg-white/10",
								)}
							>
								{tab.count}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
