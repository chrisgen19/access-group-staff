"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, UserCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MobileSidebarTrigger } from "@/components/shared/dashboard-sidebar";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;
	const initial = user
		? ((user.firstName as string)?.[0] ?? user.name?.[0] ?? "?").toUpperCase()
		: "?";

	async function handleSignOut() {
		try {
			await signOut();
			router.push("/login");
			router.refresh();
		} catch {
			toast.error("Failed to sign out");
		}
	}

	return (
		<header className="sticky top-0 z-10 flex h-20 items-center justify-between bg-card px-4 sm:px-8">
			<div className="flex items-center md:hidden">
				<MobileSidebarTrigger />
			</div>

			<div className="flex-1 md:flex-none" />

			<div className="flex items-center gap-3">
				<ThemeToggle />
				{user && <NotificationBell />}
				{user && (
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1.5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer outline-none">
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
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" sideOffset={8}>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() =>
									router.push("/dashboard/profile")
								}
							>
								<UserCircle size={16} />
								My Profile
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={handleSignOut}
							>
								<LogOut size={16} />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</header>
	);
}
