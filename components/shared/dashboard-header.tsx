"use client";

import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MobileSidebarTrigger } from "@/components/shared/dashboard-sidebar";
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

export function DashboardHeader({ helpMeEnabled }: { helpMeEnabled: boolean }) {
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
		<header className="sticky top-0 z-10 flex h-20 items-center justify-between bg-card px-4 sm:px-8">
			<div className="flex items-center md:hidden">
				<MobileSidebarTrigger helpMeEnabled={helpMeEnabled} />
			</div>

			<div className="flex-1 md:flex-none" />

			<div className="flex items-center gap-3">
				<ThemeToggle />
				{user && <NotificationBell />}
				{user && (
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1.5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer outline-none">
							<UserAvatar
								firstName={user.firstName ?? ""}
								lastName={user.lastName ?? ""}
								avatar={user.avatar}
								image={user.image}
								size="md"
								className="bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15"
							/>
							<span className="hidden text-sm font-medium text-foreground sm:block">
								{user.name}
							</span>
							<ChevronDown size={16} className="mr-1 hidden text-muted-foreground sm:block" />
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
		</header>
	);
}
