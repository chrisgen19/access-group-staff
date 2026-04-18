import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import { RecognitionTabs, type TabItem } from "../_components/recognition-tabs";

export default async function RecognitionInboxLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const isAdmin = hasMinRole(getUserRole(session), "ADMIN");

	const tabs: TabItem[] = [];

	if (isAdmin) {
		tabs.push({
			key: "all",
			label: "All",
			href: "/dashboard/recognition/all",
			icon: "LayoutList",
		});
	}

	tabs.push(
		{
			key: "received",
			label: "Received",
			href: "/dashboard/recognition/received",
			icon: "Inbox",
		},
		{
			key: "sent",
			label: "Sent",
			href: "/dashboard/recognition/sent",
			icon: "Send",
		},
	);

	return (
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						Recognition Card
					</h1>
					<p className="mt-2 text-base text-muted-foreground">Your personal recognition inbox.</p>
				</div>
				<Link
					href="/dashboard/recognition/create"
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					Send Recognition Card
				</Link>
			</div>

			<RecognitionTabs tabs={tabs} />

			{children}
		</div>
	);
}
