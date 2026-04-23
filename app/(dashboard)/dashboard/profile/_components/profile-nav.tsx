"use client";

import { Link2, Lock, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{
		label: "Profile",
		href: "/dashboard/profile",
		icon: User,
	},
	{
		label: "Security",
		href: "/dashboard/profile/security",
		icon: Lock,
	},
	{
		label: "Connected Accounts",
		href: "/dashboard/profile/connected-accounts",
		icon: Link2,
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
		<nav className="flex gap-1 overflow-x-auto pb-1 sm:w-48 sm:shrink-0 sm:flex-col sm:overflow-visible sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			{NAV_ITEMS.map((item) => {
				const isActive = pathname === item.href;
				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
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
