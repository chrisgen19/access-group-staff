"use client";

import { usePathname } from "next/navigation";
import { AccessGroupLogo } from "@/components/shared/access-logos";
import { DashboardAccountControls } from "@/components/shared/dashboard-account-controls";
import { MobileSidebarTrigger } from "@/components/shared/dashboard-sidebar";

function getMobileSectionLabel(pathname: string) {
	const segment = pathname.split("/")[2] ?? "";

	switch (segment) {
		case "recognition":
			return "Recognition";
		case "leaderboard":
			return "Leaderboard";
		case "users":
			return "Staff";
		case "departments":
			return "Departments";
		case "profile":
			return "Profile";
		case "helpme":
			return "Help Me";
		case "admin-settings":
			return "Admin Settings";
		case "super-admin":
			return "Super Admin";
		default:
			return "Dashboard";
	}
}

export function DashboardHeader({
	helpMeEnabled,
	initialUserRole,
}: {
	helpMeEnabled: boolean;
	initialUserRole: "STAFF" | "ADMIN" | "SUPERADMIN";
}) {
	const pathname = usePathname();
	const sectionLabel = getMobileSectionLabel(pathname);

	return (
		<header className="sticky top-0 z-20 px-safe pt-safe md:hidden">
			<div className="flex h-[4.5rem] items-center justify-between border-b border-black/5 bg-background/88 px-4 backdrop-blur-xl dark:border-white/8">
				<div className="flex min-w-0 items-center gap-3">
					<MobileSidebarTrigger helpMeEnabled={helpMeEnabled} initialUserRole={initialUserRole} />
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<AccessGroupLogo color="currentColor" className="h-5 w-auto text-primary" />
						</div>
						<p className="truncate text-sm font-semibold text-foreground">{sectionLabel}</p>
					</div>
				</div>

				<DashboardAccountControls />
			</div>
		</header>
	);
}
