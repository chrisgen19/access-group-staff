import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<DashboardSidebar />
			<div className="flex flex-1 flex-col overflow-hidden bg-card sm:my-2 sm:mr-2 sm:rounded-l-[2rem] shadow-sm border border-gray-100 dark:border-white/5">
				<DashboardHeader />
				<main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-8">
					{children}
				</main>
			</div>
		</div>
	);
}
