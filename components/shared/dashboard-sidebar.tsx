"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
	LayoutDashboard,
	Users,
	Building2,
	Heart,
	UserCircle,
	Settings,
	ShieldCheck,
	LogOut,
	Menu,
} from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AccessGroupLogo } from "@/components/shared/access-logos";
import { NotificationBadge } from "@/components/shared/notification-badge";

type MinRole = "STAFF" | "ADMIN" | "SUPERADMIN";

const NAV_ITEMS: {
	label: string;
	href: string;
	icon: React.ComponentType<{ size?: number }>;
	minRole: MinRole;
}[] = [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		minRole: "STAFF",
	},
	{
		label: "Recognition Card",
		href: "/dashboard/recognition",
		icon: Heart,
		minRole: "STAFF",
	},
	{
		label: "Staff",
		href: "/dashboard/users",
		icon: Users,
		minRole: "ADMIN",
	},
	{
		label: "Departments",
		href: "/dashboard/departments",
		icon: Building2,
		minRole: "ADMIN",
	},
	{
		label: "My Profile",
		href: "/dashboard/profile",
		icon: UserCircle,
		minRole: "STAFF",
	},
	{
		label: "Admin Settings",
		href: "/dashboard/admin-settings",
		icon: Settings,
		minRole: "ADMIN",
	},
	{
		label: "Super Admin",
		href: "/dashboard/super-admin",
		icon: ShieldCheck,
		minRole: "SUPERADMIN",
	},
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = useSession();
	const userRole = ((session?.user?.role as string) ?? "STAFF") as MinRole;

	const roleLevel: Record<MinRole, number> = {
		STAFF: 0,
		ADMIN: 1,
		SUPERADMIN: 2,
	};

	const filteredItems = NAV_ITEMS.filter(
		(item) => roleLevel[userRole] >= roleLevel[item.minRole],
	);

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
			<div className="h-16 flex items-center px-4 mb-4 text-primary">
				<AccessGroupLogo color="currentColor" className="h-8 w-auto" />
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
							{item.href === "/dashboard/recognition" && <NotificationBadge />}
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
		<aside className="hidden w-72 sticky top-0 h-screen flex-col p-4 pr-2 md:flex">
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
