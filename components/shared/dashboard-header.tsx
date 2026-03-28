"use client";

import { ChevronDown } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileSidebarTrigger } from "@/components/shared/dashboard-sidebar";

export function DashboardHeader() {
	const { data: session } = useSession();
	const user = session?.user;
	const initial = user
		? ((user.firstName as string)?.[0] ?? user.name?.[0] ?? "?").toUpperCase()
		: "?";

	return (
		<header className="flex h-20 items-center justify-between px-4 sm:px-8">
			<div className="flex items-center md:hidden">
				<MobileSidebarTrigger />
			</div>

			<div className="flex-1 md:flex-none" />

			<div className="flex items-center gap-3">
				<ThemeToggle />
				{user && (
					<button
						type="button"
						className="flex items-center gap-2 rounded-full p-1.5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer"
					>
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.96_0.03_18)] text-primary text-sm font-medium dark:bg-primary/15">
							{initial}
						</div>
						<span className="hidden text-sm font-medium text-foreground sm:block">
							{user.name}
						</span>
						<ChevronDown
							size={16}
							className="mr-1 hidden text-muted-foreground sm:block"
						/>
					</button>
				)}
			</div>
		</header>
	);
}
