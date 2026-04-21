import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { HelpFab } from "@/components/shared/help-fab";
import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { getServerSession } from "@/lib/auth-utils";
import { hasMinRole } from "@/lib/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const helpMeEnabled = await getHelpMeEnabled();
	const viewerIsAdmin = hasMinRole(session.user.role as Role, "ADMIN");
	// Admins always see the Help Me surfaces so they can triage existing tickets
	// and toggle the module back on.
	const showHelpMe = helpMeEnabled || viewerIsAdmin;

	return (
		<div className="flex min-h-screen bg-background">
			<DashboardSidebar helpMeEnabled={showHelpMe} />
			<div className="flex flex-1 flex-col bg-card sm:my-2 sm:mr-2 sm:rounded-l-[2rem] shadow-sm border border-gray-100 dark:border-white/5">
				<DashboardHeader helpMeEnabled={showHelpMe} />
				<main className="flex-1 px-4 pb-8 sm:px-8">{children}</main>
			</div>
			<HelpFab enabled={showHelpMe} />
		</div>
	);
}
