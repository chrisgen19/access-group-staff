import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import { RecognitionFeedWidget } from "./_components/recognition-feed-widget";
import { StickyStatsWidget } from "./_components/stats-widget";

export default async function DashboardPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = session.user;
	const isAdmin = hasMinRole(getUserRole(session), "ADMIN");

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Dashboard"
				title={<>Welcome back, {(user.firstName as string) ?? user.name}!</>}
				description="Here’s what’s happening at Access Group today."
				actions={
					<Link
						href="/dashboard/recognition/create"
						className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30"
					>
						<Plus className="-ml-1 h-5 w-5" />
						Send Recognition Card
					</Link>
				}
			/>

			{/* Widgets: Public Feed + Stats */}
			<div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
				<div className="order-2 lg:order-1">
					<RecognitionFeedWidget currentUserId={user.id} isAdmin={isAdmin} />
				</div>
				<div className="order-1 lg:order-2">
					<StickyStatsWidget />
				</div>
			</div>
		</div>
	);
}
