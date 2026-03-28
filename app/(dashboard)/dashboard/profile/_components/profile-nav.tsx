"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{
		label: "Profile",
		href: "/dashboard/profile",
		icon: User,
	},
	{
		label: "Preferences",
		href: "/dashboard/profile/preferences",
		icon: Settings,
	},
];

export function ProfileNav() {
	const pathname = usePathname();

	return (
		<nav className="flex flex-row gap-1 sm:flex-col sm:w-48 sm:shrink-0">
			{NAV_ITEMS.map((item) => {
				const isActive = pathname === item.href;
				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
							isActive
								? "bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15 dark:text-primary"
								: "text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5",
						)}
					>
						<item.icon size={18} />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
