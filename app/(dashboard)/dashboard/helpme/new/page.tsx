import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { TicketForm } from "../_components/ticket-form";

export default async function NewTicketPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="max-w-2xl mx-auto p-4 md:p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold">Raise a Ticket</h1>
				<p className="text-sm text-muted-foreground">
					Describe your issue and the right team will respond as soon as possible.
				</p>
			</div>
			<TicketForm />
		</div>
	);
}
