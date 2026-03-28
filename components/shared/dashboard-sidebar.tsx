"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, UserCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		adminOnly: false,
	},
	{
		label: "Users",
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

export function DashboardSidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const userRole = (session?.user?.role as string) ?? "STAFF";
	const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

	const filteredItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

	return (
		<Sidebar>
			<SidebarHeader className="border-b px-6 py-4">
				<Link href="/dashboard" className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
						AG
					</div>
					<span className="font-semibold text-lg">Access Group</span>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{filteredItems.map((item) => {
								const isActive =
									pathname === item.href ||
									(item.href !== "/dashboard" && pathname.startsWith(item.href));
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											asChild
											className={cn(isActive && "bg-sidebar-accent")}
										>
											<Link href={item.href}>
												<item.icon className="h-4 w-4" />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
