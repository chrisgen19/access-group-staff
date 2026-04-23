import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { getTicketByIdForCurrentUser } from "@/lib/actions/helpme-actions";
import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { getServerSession } from "@/lib/auth-utils";
import { displayReplyAuthor } from "@/lib/helpme-display";
import { sanitizeReplyHtml } from "@/lib/sanitize-html";
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

	if (!(await getHelpMeEnabled())) notFound();

	const viewerRole = session.user.role as Role;

	const { id } = await params;
	const ticket = await getTicketByIdForCurrentUser(id);
	if (!ticket) notFound();

	const viewerId = session.user.id;
	const creatorDisplay = displayReplyAuthor(ticket.createdBy, viewerRole);

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
				title={ticket.subject}
				description={`Raised by ${creatorDisplay.displayName} · ${formatDateTime(ticket.createdAt)}`}
				meta={
					<>
						<span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/10">
							{CATEGORY_LABEL[ticket.category]}
						</span>
						<Badge variant="secondary" className={STATUS_STYLES[ticket.status]}>
							{STATUS_LABEL[ticket.status]}
						</Badge>
					</>
				}
			/>

			<div className="max-w-4xl space-y-6">
				<div className="space-y-5 rounded-[2rem] border border-gray-200/60 bg-card p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] dark:border-white/10">
					<div
						className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized here on read to protect against any pre-rich-text legacy rows
						dangerouslySetInnerHTML={{ __html: sanitizeReplyHtml(ticket.body) }}
					/>
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
					<div className="rounded-[2rem] border border-dashed border-gray-200 bg-card/50 p-6 text-center text-sm text-muted-foreground dark:border-white/10">
						This ticket is closed. Create a new ticket if you need further help.
					</div>
				) : (
					<div className="rounded-[2rem] border border-gray-200/60 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] dark:border-white/10">
						<ReplyForm ticketId={ticket.id} />
					</div>
				)}
			</div>
		</div>
	);
}
