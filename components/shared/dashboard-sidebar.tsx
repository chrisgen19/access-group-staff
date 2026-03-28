"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
	LayoutDashboard,
	Users,
	Building2,
	UserCircle,
	LogOut,
	Menu,
} from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const NAV_ITEMS = [
	{
		label: "Overview",
		href: "/dashboard",
		icon: LayoutDashboard,
		adminOnly: false,
	},
	{
		label: "Staff",
		href: "/dashboard/users",
		icon: Users,
		adminOnly: true,
	},
	{
		label: "Departments",
		href: "/dashboard/departments",
		icon: Building2,
		adminOnly: true,
	},
	{
		label: "My Profile",
		href: "/dashboard/profile",
		icon: UserCircle,
		adminOnly: false,
	},
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = useSession();
	const userRole = (session?.user?.role as string) ?? "STAFF";
	const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

	const filteredItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

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
		<>
			<div className="h-16 flex items-center px-4 mb-4">
				<div className="p-2 bg-white dark:bg-card rounded-[1.5rem] shadow-sm border border-gray-100/50 dark:border-white/10 mr-3">
					<Building2 className="text-primary" size={22} strokeWidth={1.5} />
				</div>
				<span className="text-xl font-medium text-foreground tracking-tight">
					Access Group
				</span>
			</div>

			<nav className="flex-1 space-y-1">
				{filteredItems.map((item) => {
					const isActive =
						pathname === item.href ||
						(item.href !== "/dashboard" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onNavigate}
							className={cn(
								"flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200",
								isActive
									? "bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15 dark:text-primary"
									: "text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5",
							)}
						>
							<item.icon size={22} />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<button
				type="button"
				onClick={handleSignOut}
				className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
			>
				<LogOut size={22} />
				Sign Out
			</button>
		</>
	);
}

export function DashboardSidebar() {
	return (
		<aside className="hidden w-72 flex-col p-4 pr-2 md:flex">
			<SidebarNav />
		</aside>
	);
}

export function MobileSidebarTrigger() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors md:hidden"
			>
				<Menu size={22} />
			</button>
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent side="left" className="w-72 p-4" showCloseButton={false}>
					<SidebarNav onNavigate={() => setOpen(false)} />
				</SheetContent>
			</Sheet>
		</>
	);
}
