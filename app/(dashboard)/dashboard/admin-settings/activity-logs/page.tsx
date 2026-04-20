import { redirect } from "next/navigation";
import type { ActivityAction, Prisma } from "@/app/generated/prisma/client";
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
];

interface SearchParams {
	actor?: string;
	action?: string;
	from?: string;
	to?: string;
	target?: string;
	page?: string;
}

function parseDate(value: string | undefined, endOfDay = false): Date | null {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
	return Number.isNaN(d.getTime()) ? null : d;
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
	const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

	const where: Prisma.ActivityLogWhereInput = {};
	if (params.actor) where.actorId = params.actor;
	if (params.action && (ACTIONS as readonly string[]).includes(params.action)) {
		where.action = params.action as ActivityAction;
	}
	const from = parseDate(params.from);
	const to = parseDate(params.to, true);
	if (from || to) {
		where.createdAt = {
			...(from ? { gte: from } : {}),
			...(to ? { lte: to } : {}),
		};
	}
	if (params.target) {
		where.OR = [
			{ targetType: { contains: params.target, mode: "insensitive" } },
			{ targetId: { contains: params.target, mode: "insensitive" } },
		];
	}

	const [total, logs, users] = await Promise.all([
		prisma.activityLog.count({ where }),
		prisma.activityLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: {
				actor: {
					select: { id: true, firstName: true, lastName: true, email: true },
				},
			},
			take: PAGE_SIZE,
			skip: (page - 1) * PAGE_SIZE,
		}),
		prisma.user.findMany({
			where: { deletedAt: null },
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
			select: { id: true, firstName: true, lastName: true, email: true },
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Activity Logs
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Audit trail of authentication and account events.
				</p>
			</div>

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
