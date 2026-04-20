import Link from "next/link";
import type { ActivityAction, ActivityLog } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const ACTION_LABELS: Record<ActivityAction, string> = {
	USER_SIGNED_IN: "Signed in",
	USER_SIGNED_OUT: "Signed out",
	SIGN_IN_FAILED: "Sign-in failed",
	OAUTH_ACCOUNT_LINKED: "OAuth linked",
	PASSWORD_CHANGED: "Password changed",
	PASSWORD_RESET: "Password reset",
};

const DESTRUCTIVE_ACTIONS = new Set<ActivityAction>(["SIGN_IN_FAILED"]);

type LogWithActor = ActivityLog & {
	actor: { id: string; firstName: string; lastName: string; email: string } | null;
};

interface ActivityLogTableProps {
	logs: LogWithActor[];
	page: number;
	totalPages: number;
	total: number;
	baseQuery: Record<string, string>;
}

function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat("en-AU", {
		dateStyle: "medium",
		timeStyle: "short",
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
		try {
			const entries = Object.entries(metadata as Record<string, unknown>);
			if (entries.length === 0) return "—";
			return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ");
		} catch {
			return "—";
		}
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
	totalPages,
	total,
	baseQuery,
}: ActivityLogTableProps) {
	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="flex items-center justify-between px-8 pt-6 pb-2">
				<p className="text-sm text-muted-foreground">
					{total} {total === 1 ? "entry" : "entries"}
				</p>
				<p className="text-xs text-muted-foreground">
					Page {page} of {totalPages}
				</p>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>When</TableHead>
							<TableHead>Actor</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Target</TableHead>
							<TableHead>Metadata</TableHead>
							<TableHead>IP</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
									No activity found.
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => (
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
							))
						)}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-end gap-2 px-8 py-4">
					{page > 1 ? (
						<Link
							href={buildPageHref(baseQuery, page - 1)}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Previous
						</Link>
					) : (
						<Button variant="outline" size="sm" disabled>
							Previous
						</Button>
					)}
					{page < totalPages ? (
						<Link
							href={buildPageHref(baseQuery, page + 1)}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Next
						</Link>
					) : (
						<Button variant="outline" size="sm" disabled>
							Next
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
