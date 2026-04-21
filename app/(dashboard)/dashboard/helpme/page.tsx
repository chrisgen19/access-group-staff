import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						{isAdmin ? "Help Me Tickets" : "My Tickets"}
					</h1>
					<p className="mt-2 text-base text-muted-foreground">
						{isAdmin
							? "Respond to tickets raised by staff."
							: "Raise an issue or request help from HR/IT."}
					</p>
				</div>
				<Link
					href="/dashboard/helpme/new"
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					New Ticket
				</Link>
			</div>

			<TicketList tickets={tickets} isAdmin={isAdmin} />
		</div>
	);
}
