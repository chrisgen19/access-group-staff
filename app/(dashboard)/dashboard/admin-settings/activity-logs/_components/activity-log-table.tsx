import { ChevronLeft, ChevronRight, FileSearch } from "lucide-react";
import Link from "next/link";
import type { ActivityAction, ActivityLog } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<ActivityAction, string> = {
	USER_SIGNED_IN: "Signed in",
	USER_SIGNED_OUT: "Signed out",
	SIGN_IN_FAILED: "Sign-in failed",
	OAUTH_ACCOUNT_LINKED: "OAuth linked",
	PASSWORD_CHANGED: "Password changed",
	PASSWORD_RESET: "Password reset",
	PASSWORD_SET: "Password set",
	USER_VISITED: "Visited",
	CARD_CREATED: "Card created",
	CARD_UPDATED: "Card edited",
	CARD_DELETED: "Card deleted",
	CARD_REACTED: "Card reacted",
	CARD_UNREACTED: "Reaction removed",
	COMMENT_CREATED: "Comment added",
	COMMENT_UPDATED: "Comment edited",
	COMMENT_DELETED: "Comment deleted",
	TICKET_CREATED: "Ticket created",
	TICKET_REPLIED: "Ticket replied",
};

const DESTRUCTIVE_ACTIONS = new Set<ActivityAction>([
	"SIGN_IN_FAILED",
	"CARD_DELETED",
	"COMMENT_DELETED",
]);

type LogWithActor = ActivityLog & {
	actor: { id: string; firstName: string; lastName: string; email: string } | null;
};

interface ActivityLogTableProps {
	logs: LogWithActor[];
	page: number;
	pageSize: number;
	totalPages: number;
	total: number;
	hasActiveFilters: boolean;
	baseQuery: Record<string, string>;
}

function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat("en-PH", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Manila",
	}).format(date);
}

function formatTarget(log: LogWithActor): string {
	if (log.targetType && log.targetId) return `${log.targetType}:${log.targetId}`;
	if (log.targetId) return log.targetId;
	if (log.targetType) return log.targetType;
	return "—";
}

function formatMetadata(metadata: unknown): string {
	if (!metadata) return "—";
	if (typeof metadata === "object") {
		const entries = Object.entries(metadata as Record<string, unknown>);
		if (entries.length === 0) return "—";
		return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ");
	}
	return String(metadata);
}

function buildPageHref(base: Record<string, string>, page: number): string {
	const sp = new URLSearchParams(base);
	sp.set("page", String(page));
	return `?${sp.toString()}`;
}

export function ActivityLogTable({
	logs,
	page,
	pageSize,
	totalPages,
	total,
	hasActiveFilters,
	baseQuery,
}: ActivityLogTableProps) {
	if (logs.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
				<div className="mb-6 rounded-full bg-background p-6">
					<FileSearch size={48} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					{hasActiveFilters ? "No matching activity" : "No activity yet"}
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					{hasActiveFilters
						? "No entries match your current filters."
						: "Auth, account, and product activity will appear here as they happen."}
				</p>
				{hasActiveFilters && (
					<Link
						href="?"
						className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
					>
						Clear all filters
					</Link>
				)}
			</div>
		);
	}

	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<>
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30 hover:bg-muted/30">
								<TableHead>When</TableHead>
								<TableHead>Actor</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Metadata</TableHead>
								<TableHead>IP</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.map((log) => (
								<TableRow key={log.id}>
									<TableCell className="whitespace-nowrap text-sm">
										{formatDateTime(log.createdAt)}
									</TableCell>
									<TableCell className="text-sm">
										{log.actor ? (
											<div>
												<div className="font-medium">
													{log.actor.firstName} {log.actor.lastName}
												</div>
												<div className="text-xs text-muted-foreground">{log.actor.email}</div>
											</div>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										<Badge
											variant={DESTRUCTIVE_ACTIONS.has(log.action) ? "destructive" : "secondary"}
										>
											{ACTION_LABELS[log.action]}
										</Badge>
									</TableCell>
									<TableCell className="text-sm">{formatTarget(log)}</TableCell>
									<TableCell
										className="text-sm max-w-xs truncate"
										title={formatMetadata(log.metadata)}
									>
										{formatMetadata(log.metadata)}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{log.ipAddress ?? "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between pt-2">
					<p className="text-sm text-muted-foreground">
						Showing {from}–{to} of {total} {total === 1 ? "entry" : "entries"}
					</p>
					<div className="flex items-center gap-2">
						<PagerButton
							disabled={page <= 1}
							href={page > 1 ? buildPageHref(baseQuery, page - 1) : undefined}
						>
							<ChevronLeft size={16} />
							Previous
						</PagerButton>
						<span className="text-sm font-medium text-foreground">
							{page} / {totalPages}
						</span>
						<PagerButton
							disabled={page >= totalPages}
							href={page < totalPages ? buildPageHref(baseQuery, page + 1) : undefined}
						>
							Next
							<ChevronRight size={16} />
						</PagerButton>
					</div>
				</div>
			)}
		</>
	);
}

function PagerButton({
	disabled,
	href,
	children,
}: {
	disabled: boolean;
	href?: string;
	children: React.ReactNode;
}) {
	const classes = cn(
		"inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors",
		disabled && "opacity-30 pointer-events-none",
	);
	if (disabled || !href) {
		return (
			<span aria-disabled className={classes}>
				{children}
			</span>
		);
	}
	return (
		<Link href={href} className={classes}>
			{children}
		</Link>
	);
}
