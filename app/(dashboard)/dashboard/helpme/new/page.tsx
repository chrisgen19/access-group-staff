import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { TicketForm } from "../_components/ticket-form";

export default async function NewTicketPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
			<Link
				href="/dashboard/helpme"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft size={16} /> Back to tickets
			</Link>

			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Raise a Ticket
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Describe your issue and the right team will respond as soon as possible.
				</p>
			</div>

			<div className="max-w-3xl">
				<TicketForm />
			</div>
		</div>
	);
}
