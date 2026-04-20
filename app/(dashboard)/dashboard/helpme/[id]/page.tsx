import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { getTicketByIdForCurrentUser } from "@/lib/actions/helpme-actions";
import { getServerSession } from "@/lib/auth-utils";
import { displayReplyAuthor } from "@/lib/helpme-display";
import { ReplyForm } from "../_components/reply-form";
import { ReplyItem } from "../_components/reply-item";

const STATUS_STYLES: Record<string, string> = {
	OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
	IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
	RESOLVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
	CLOSED: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_LABEL: Record<string, string> = {
	OPEN: "Open",
	IN_PROGRESS: "In Progress",
	RESOLVED: "Resolved",
	CLOSED: "Closed",
};

const CATEGORY_LABEL: Record<string, string> = {
	HR: "HR",
	IT_WEBSITE: "IT / Website",
	PAYROLL: "Payroll",
	FACILITIES: "Facilities",
	OTHER: "Other",
};

function formatDateTime(date: Date) {
	return new Intl.DateTimeFormat("en-AU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const { id } = await params;
	const ticket = await getTicketByIdForCurrentUser(id);
	if (!ticket) notFound();

	const viewerRole = session.user.role as Role;
	const viewerId = session.user.id;
	const creatorDisplay = displayReplyAuthor(ticket.createdBy, viewerRole);

	return (
		<div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
			<Link
				href="/dashboard/helpme"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft size={16} /> Back to tickets
			</Link>

			<div className="rounded-2xl border bg-card p-6 space-y-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold">{ticket.subject}</h1>
						<p className="text-xs text-muted-foreground mt-1">
							Raised by {creatorDisplay.displayName} · {formatDateTime(ticket.createdAt)}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline">{CATEGORY_LABEL[ticket.category]}</Badge>
						<Badge variant="secondary" className={STATUS_STYLES[ticket.status]}>
							{STATUS_LABEL[ticket.status]}
						</Badge>
					</div>
				</div>

				<div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
					{ticket.body}
				</div>
			</div>

			<div className="space-y-3">
				<h2 className="text-sm font-medium text-muted-foreground">
					{ticket.replies.length === 0
						? "No replies yet"
						: `${ticket.replies.length} repl${ticket.replies.length === 1 ? "y" : "ies"}`}
				</h2>
				{ticket.replies.map((r) => (
					<ReplyItem
						key={r.id}
						reply={{
							id: r.id,
							bodyHtml: r.bodyHtml,
							createdAt: r.createdAt.toISOString(),
							editedAt: r.editedAt ? r.editedAt.toISOString() : null,
							canEdit: r.authorId === viewerId,
							author: displayReplyAuthor(r.author, viewerRole),
						}}
					/>
				))}
			</div>

			{ticket.status === "CLOSED" ? (
				<div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
					This ticket is closed. Create a new ticket if you need further help.
				</div>
			) : (
				<div className="rounded-2xl border bg-card p-4">
					<ReplyForm ticketId={ticket.id} />
				</div>
			)}
		</div>
	);
}
