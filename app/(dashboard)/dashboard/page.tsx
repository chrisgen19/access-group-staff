import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatsWidget } from "./_components/stats-widget";
import { RecognitionFeedWidget } from "./_components/recognition-feed-widget";

export default async function DashboardPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = session.user;

	return (
		<div className="max-w-7xl mx-auto mt-2 space-y-8">
			{/* Top Row: Welcome + Send Button */}
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						Welcome back,{" "}
						{(user.firstName as string) ?? user.name}!
					</h1>
					<p className="mt-2 text-base text-muted-foreground">
						Here&apos;s what&apos;s happening at Access Group today.
					</p>
				</div>
				<Link
					href="/dashboard/recognition/create"
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					Send Recognition Card
				</Link>
			</div>

			{/* Widgets: Public Feed + Stats */}
			<div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
				<div className="order-2 lg:order-1">
					<RecognitionFeedWidget />
				</div>
				<div className="order-1 lg:order-2">
					<StatsWidget />
				</div>
			</div>
		</div>
	);
}
