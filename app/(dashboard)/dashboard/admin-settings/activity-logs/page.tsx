import { redirect } from "next/navigation";
import type { ActivityAction, Prisma } from "@/app/generated/prisma/client";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { pruneActivityLogsIfNeeded } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ActivityLogFilters } from "./_components/activity-log-filters";
import { ActivityLogTable } from "./_components/activity-log-table";

const PAGE_SIZE = 50;

const ACTIONS: ActivityAction[] = [
	"USER_SIGNED_IN",
	"USER_SIGNED_OUT",
	"SIGN_IN_FAILED",
	"OAUTH_ACCOUNT_LINKED",
	"PASSWORD_CHANGED",
	"PASSWORD_RESET",
	"PASSWORD_SET",
	"USER_VISITED",
	"CARD_CREATED",
	"CARD_UPDATED",
	"CARD_DELETED",
	"CARD_REACTED",
	"CARD_UNREACTED",
	"COMMENT_CREATED",
	"COMMENT_UPDATED",
	"COMMENT_DELETED",
	"TICKET_CREATED",
	"TICKET_REPLIED",
	"TICKET_REPLY_UPDATED",
	"TICKET_REPLY_DELETED",
];

interface SearchParams {
	actor?: string;
	action?: string;
	from?: string;
	to?: string;
	target?: string;
	page?: string;
}

const MANILA_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

function parseManilaDayStart(value: string | undefined): Date | null {
	if (!value) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const year = Number.parseInt(match[1] ?? "", 10);
	const month = Number.parseInt(match[2] ?? "", 10) - 1;
	const day = Number.parseInt(match[3] ?? "", 10);
	if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
	return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - MANILA_TZ_OFFSET_MS);
}

function parseManilaDayEndExclusive(value: string | undefined): Date | null {
	const start = parseManilaDayStart(value);
	if (!start) return null;
	return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export default async function ActivityLogsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	try {
		await requireRole("ADMIN");
	} catch {
		redirect("/dashboard");
	}

	await pruneActivityLogsIfNeeded();

	const params = await searchParams;
	const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

	const where: Prisma.ActivityLogWhereInput = {};
	if (params.actor) where.actorId = params.actor;
	if (params.action && (ACTIONS as readonly string[]).includes(params.action)) {
		where.action = params.action as ActivityAction;
	}
	const from = parseManilaDayStart(params.from);
	const to = parseManilaDayEndExclusive(params.to);
	if (from || to) {
		where.createdAt = {
			...(from ? { gte: from } : {}),
			...(to ? { lt: to } : {}),
		};
	}
	if (params.target) {
		where.OR = [
			{ targetType: { contains: params.target, mode: "insensitive" } },
			{ targetId: { contains: params.target, mode: "insensitive" } },
		];
	}

	const [total, users] = await Promise.all([
		prisma.activityLog.count({ where }),
		prisma.user.findMany({
			where: { deletedAt: null },
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
			select: { id: true, firstName: true, lastName: true, email: true },
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const page = Math.min(requestedPage, totalPages);

	const logs = await prisma.activityLog.findMany({
		where,
		orderBy: { createdAt: "desc" },
		include: {
			actor: {
				select: { id: true, firstName: true, lastName: true, email: true },
			},
		},
		take: PAGE_SIZE,
		skip: (page - 1) * PAGE_SIZE,
	});

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Administration"
				title="Activity Logs"
				description="Audit trail of authentication, account, and product activity."
			/>

			<ActivityLogFilters
				users={users}
				actions={ACTIONS}
				initial={{
					actor: params.actor ?? "",
					action: params.action ?? "",
					from: params.from ?? "",
					to: params.to ?? "",
					target: params.target ?? "",
				}}
			/>

			<ActivityLogTable
				logs={logs}
				page={page}
				pageSize={PAGE_SIZE}
				totalPages={totalPages}
				total={total}
				hasActiveFilters={
					!!params.actor || !!params.action || !!params.from || !!params.to || !!params.target
				}
				baseQuery={{
					...(params.actor ? { actor: params.actor } : {}),
					...(params.action ? { action: params.action } : {}),
					...(params.from ? { from: params.from } : {}),
					...(params.to ? { to: params.to } : {}),
					...(params.target ? { target: params.target } : {}),
				}}
			/>
		</div>
	);
}
