import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = session.user;

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Welcome back, {user.firstName as string ?? user.name}!
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Here&apos;s what&apos;s happening at Access Group today.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card p-16 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="mb-6 rounded-full bg-background p-6">
					<LayoutDashboard size={48} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					Recognition feed coming in Phase 2
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					This is where you&apos;ll see recognition cards from your colleagues.
				</p>
			</div>
		</div>
	);
}
