"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function DashboardHeader() {
	const router = useRouter();
	const { data: session } = useSession();

	async function handleSignOut() {
		try {
			await signOut();
			router.push("/login");
			router.refresh();
		} catch {
			toast.error("Failed to sign out");
		}
	}

	const user = session?.user;
	const initials = user
		? `${(user.firstName as string)?.[0] ?? ""}${(user.lastName as string)?.[0] ?? ""}`.toUpperCase()
		: "?";

	return (
		<header className="flex h-16 items-center justify-between border-b px-4">
			<div className="flex items-center gap-2">
				<SidebarTrigger />
				<Separator orientation="vertical" className="h-6" />
				<h1 className="text-lg font-semibold">Access Recognition</h1>
			</div>
			<div className="flex items-center gap-3">
				<ThemeToggle />
				{user && (
					<div className="flex items-center gap-3">
						<div className="hidden items-center gap-2 sm:flex">
							<Avatar className="h-8 w-8">
								<AvatarImage src={user.image ?? undefined} />
								<AvatarFallback className="text-xs">{initials}</AvatarFallback>
							</Avatar>
							<div className="flex flex-col">
								<span className="text-sm font-medium leading-none">{user.name}</span>
								<Badge variant="outline" className="mt-0.5 w-fit text-[10px]">
									{user.role as string}
								</Badge>
							</div>
						</div>
						<Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</header>
	);
}
