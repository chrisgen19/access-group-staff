import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { HelpFab } from "@/components/shared/help-fab";
import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { getServerSession } from "@/lib/auth-utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const helpMeEnabled = await getHelpMeEnabled();
	const initialUserRole = session.user.role as "STAFF" | "ADMIN" | "SUPERADMIN";

	return (
		<div className="flex min-h-screen bg-[radial-gradient(circle_at_top,oklch(0.985_0.012_18),transparent_36%),linear-gradient(to_bottom,oklch(0.992_0_0),oklch(0.97_0_0))] dark:bg-[linear-gradient(to_bottom,oklch(0.16_0.01_18),oklch(0.145_0_0))]">
			<DashboardSidebar helpMeEnabled={helpMeEnabled} initialUserRole={initialUserRole} />
			<div className="relative flex min-h-screen min-w-0 flex-1 flex-col bg-background/92 md:bg-card md:shadow-sm md:backdrop-blur-sm md:my-2 md:mr-2 md:rounded-l-[2rem] md:border md:border-gray-100 dark:md:border-white/5">
				<DashboardHeader helpMeEnabled={helpMeEnabled} initialUserRole={initialUserRole} />
				<main className="flex-1 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-8 md:pb-8">
					<div className="mx-auto min-w-0">{children}</div>
				</main>
			</div>
			<HelpFab enabled={helpMeEnabled} />
		</div>
	);
}
