"use client";

import {
	Building2,
	ChevronDown,
	Heart,
	LayoutDashboard,
	LifeBuoy,
	LogOut,
	Menu,
	Settings,
	ShieldCheck,
	Trophy,
	UserCircle,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AccessGroupLogo } from "@/components/shared/access-logos";
import { NotificationBadge } from "@/components/shared/notification-badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type MinRole = "STAFF" | "ADMIN" | "SUPERADMIN";

interface NavChild {
	label: string;
	href: string;
}

interface NavItem {
	label: string;
	adminLabel?: string;
	href: string;
	icon: React.ComponentType<{ size?: number; className?: string }>;
	minRole: MinRole;
	children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
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
		label: "Leaderboard",
		href: "/dashboard/leaderboard",
		icon: Trophy,
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
		label: "My Tickets",
		adminLabel: "Help Me Tickets",
		href: "/dashboard/helpme",
		icon: LifeBuoy,
		minRole: "STAFF",
	},
	{
		label: "Admin Settings",
		href: "/dashboard/admin-settings",
		icon: Settings,
		minRole: "ADMIN",
		children: [
			{
				label: "Activity Logs",
				href: "/dashboard/admin-settings/activity-logs",
			},
		],
	},
	{
		label: "Super Admin",
		href: "/dashboard/super-admin",
		icon: ShieldCheck,
		minRole: "SUPERADMIN",
	},
];

interface SidebarNavProps {
	onNavigate?: () => void;
	helpMeEnabled: boolean;
	initialUserRole: MinRole;
}

function SidebarNav({ onNavigate, helpMeEnabled, initialUserRole }: SidebarNavProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const sessionRole = session?.user?.role as string | undefined;
	const userRole = (sessionRole ?? (isPending ? initialUserRole : "STAFF")) as MinRole;

	const roleLevel: Record<MinRole, number> = {
		STAFF: 0,
		ADMIN: 1,
		SUPERADMIN: 2,
	};

	const filteredItems = NAV_ITEMS.filter((item) => {
		if (roleLevel[userRole] < roleLevel[item.minRole]) return false;
		if (item.href === "/dashboard/helpme" && !helpMeEnabled) return false;
		return true;
	});

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
					const hasChildren = !!item.children?.length;
					const isInGroup = item.href !== "/dashboard" && pathname.startsWith(item.href);
					const isActive = hasChildren
						? pathname === item.href
						: pathname === item.href ||
							(item.href !== "/dashboard" && pathname.startsWith(item.href));
					const resolvedLabel =
						roleLevel[userRole] >= roleLevel.ADMIN && item.adminLabel
							? item.adminLabel
							: item.label;

					return (
						<div key={item.href}>
							<Link
								href={item.href}
								onClick={onNavigate}
								title={resolvedLabel}
								className={cn(
									"flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200",
									isActive
										? "bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15 dark:text-primary"
										: "text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5",
								)}
							>
								<item.icon size={22} className="shrink-0" />
								<span className="min-w-0 flex-1 truncate">{resolvedLabel}</span>
								{item.href === "/dashboard/recognition" && <NotificationBadge />}
								{hasChildren && (
									<ChevronDown
										size={16}
										className={cn(
											"shrink-0 transition-transform duration-200",
											isInGroup ? "rotate-0" : "-rotate-90",
										)}
									/>
								)}
							</Link>

							{hasChildren && isInGroup && (
								<div className="mt-1 ml-7 space-y-1 border-l border-gray-200/60 dark:border-white/10 pl-3">
									{item.children?.map((child) => {
										const childActive =
											pathname === child.href || pathname.startsWith(`${child.href}/`);
										return (
											<Link
												key={child.href}
												href={child.href}
												onClick={onNavigate}
												title={child.label}
												className={cn(
													"flex w-full items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
													childActive
														? "bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15 dark:text-primary"
														: "text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5",
												)}
											>
												<span className="block min-w-0 truncate">{child.label}</span>
											</Link>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</nav>

			<button
				type="button"
				onClick={handleSignOut}
				className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
			>
				<LogOut size={22} className="shrink-0" />
				Sign Out
			</button>

			{/* Temporarily hidden
			<p className="px-4 pt-2 text-[11px] text-primary">
				Created by Chris Diomampo of Marketing/IT
			</p>
			*/}
		</>
	);
}

export function DashboardSidebar({
	helpMeEnabled,
	initialUserRole,
}: {
	helpMeEnabled: boolean;
	initialUserRole: MinRole;
}) {
	return (
		<aside className="sticky top-0 hidden h-screen w-[13.5rem] flex-col p-4 pr-2 md:flex">
			<SidebarNav helpMeEnabled={helpMeEnabled} initialUserRole={initialUserRole} />
		</aside>
	);
}

export function MobileSidebarTrigger({
	helpMeEnabled,
	initialUserRole,
}: {
	helpMeEnabled: boolean;
	initialUserRole: MinRole;
}) {
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
					<SidebarNav
						onNavigate={() => setOpen(false)}
						helpMeEnabled={helpMeEnabled}
						initialUserRole={initialUserRole}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
}
