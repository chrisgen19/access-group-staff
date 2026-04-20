import Link from "next/link";
import { redirect } from "next/navigation";
import { listTicketsForCurrentUser } from "@/lib/actions/helpme-actions";
import { getServerSession } from "@/lib/auth-utils";
import { TicketList } from "./_components/ticket-list";

export default async function HelpMePage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const { tickets, isAdmin } = await listTicketsForCurrentUser();

	return (
		<div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">{isAdmin ? "Help Me Tickets" : "My Tickets"}</h1>
					<p className="text-sm text-muted-foreground">
						{isAdmin
							? "Respond to tickets raised by staff."
							: "Raise an issue or request help from HR/IT."}
					</p>
				</div>
				<Link
					href="/dashboard/helpme/new"
					className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90"
				>
					New Ticket
				</Link>
			</div>

			<TicketList tickets={tickets} isAdmin={isAdmin} />
		</div>
	);
}
