import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { listTicketsForCurrentUser } from "@/lib/actions/helpme-actions";
import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { getServerSession } from "@/lib/auth-utils";
import { TicketList } from "./_components/ticket-list";

export default async function HelpMePage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	if (!(await getHelpMeEnabled())) notFound();

	const { tickets, isAdmin } = await listTicketsForCurrentUser();

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<DashboardPageHeader
				eyebrow="Support"
				title={isAdmin ? "Help Me Tickets" : "My Tickets"}
				description={
					isAdmin
						? "Respond to tickets raised by staff."
						: "Raise an issue or request help from HR/IT."
				}
				actions={
					<Link
						href="/dashboard/helpme/new"
						className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30"
					>
						<Plus className="-ml-1 h-5 w-5" />
						New Ticket
					</Link>
				}
			/>

			<TicketList tickets={tickets} isAdmin={isAdmin} />
		</div>
	);
}
