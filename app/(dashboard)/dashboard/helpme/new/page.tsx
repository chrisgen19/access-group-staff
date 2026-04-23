import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { getServerSession } from "@/lib/auth-utils";
import { TicketForm } from "../_components/ticket-form";

export default async function NewTicketPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	if (!(await getHelpMeEnabled())) notFound();

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<Link
				href="/dashboard/helpme"
				className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-200/50 hover:text-foreground dark:hover:bg-white/5"
			>
				<ArrowLeft size={16} /> Back to tickets
			</Link>

			<DashboardPageHeader
				eyebrow="Support"
				title="Raise a Ticket"
				description="Describe your issue and the right team will respond as soon as possible."
			/>

			<div className="max-w-3xl">
				<TicketForm />
			</div>
		</div>
	);
}
