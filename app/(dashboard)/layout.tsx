import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<SidebarProvider>
			<DashboardSidebar />
			<SidebarInset>
				<DashboardHeader />
				<main className="flex-1 p-6">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
