"use client";

import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function DashboardAccountControls({ className }: { className?: string }) {
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;

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
		<div className={cn("flex items-center gap-2 sm:gap-3", className)}>
			<div className="rounded-full border border-black/5 bg-card/80 p-1 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none dark:md:border-0 dark:md:bg-transparent">
				<ThemeToggle />
			</div>
			{user && (
				<div className="rounded-full border border-black/5 bg-card/80 p-1 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none dark:md:border-0 dark:md:bg-transparent">
					<NotificationBell />
				</div>
			)}
			{user && (
				<DropdownMenu>
					<DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-full border border-black/5 bg-card/80 py-1 pr-1.5 pl-1 shadow-sm backdrop-blur-sm transition-all outline-none hover:border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/15 dark:hover:bg-white/10 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none md:hover:border-transparent md:hover:bg-transparent dark:md:border-0 dark:md:bg-transparent dark:md:hover:border-transparent dark:md:hover:bg-transparent">
						<UserAvatar
							firstName={user.firstName ?? ""}
							lastName={user.lastName ?? ""}
							avatar={user.avatar}
							image={user.image}
							size="md"
							className="bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15"
						/>
						<div className="hidden min-w-0 text-left sm:block">
							<p className="truncate text-sm font-medium text-foreground">{user.name}</p>
							<p className="truncate text-[11px] text-muted-foreground">Account</p>
						</div>
						<ChevronDown
							size={16}
							className="mr-1 hidden shrink-0 text-muted-foreground sm:block"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" sideOffset={8}>
						<DropdownMenuItem
							className="cursor-pointer"
							onClick={() => router.push("/dashboard/profile")}
						>
							<UserCircle size={16} />
							My Profile
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
							<LogOut size={16} />
							Sign Out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
