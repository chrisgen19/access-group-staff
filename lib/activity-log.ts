import { type ActivityAction, Prisma } from "@/app/generated/prisma/client";
import { env } from "@/env";
import {
	ACTIVITY_LOG_RETENTION_DEFAULT,
	ACTIVITY_LOG_RETENTION_KEY,
} from "@/lib/activity-log-retention";
import { prisma } from "@/lib/db";

interface LogActivityInput {
	action: ActivityAction;
	actorId?: string | null;
	targetType?: string | null;
	targetId?: string | null;
	metadata?: Prisma.InputJsonValue;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export async function logActivity(input: LogActivityInput) {
	try {
		await prisma.activityLog.create({
			data: {
				action: input.action,
				actorId: input.actorId ?? null,
				targetType: input.targetType ?? null,
				targetId: input.targetId ?? null,
				metadata: input.metadata,
				ipAddress: input.ipAddress ?? null,
				userAgent: input.userAgent ?? null,
				visitDayUtc: input.action === "USER_VISITED" ? utcDayToday() : null,
			},
		});
	} catch (err) {
		// USER_VISITED is guarded by a partial unique index on
		// (actor_id, visit_day_utc) so idempotency is enforced server-side
		// even when the per-browser cookie throttle misses (multi-device,
		// cookie cleared, race on first request).
		if (
			input.action === "USER_VISITED" &&
			err instanceof Prisma.PrismaClientKnownRequestError &&
			err.code === "P2002"
		) {
			return;
		}
		console.error("activity-log write failed", {
			action: input.action,
			error: err instanceof Error ? err.message : String(err),
		});
	}
}

function utcDayToday(): Date {
	return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function firstIp(value: string | null): string | null {
	return value?.split(",")[0]?.trim() || null;
}

export function extractRequestMeta(headers: Headers) {
	const vercel = firstIp(headers.get("x-vercel-forwarded-for"));
	let ipAddress = vercel;
	if (!ipAddress && env.TRUST_PROXY_HEADERS) {
		ipAddress = headers.get("x-real-ip") || firstIp(headers.get("x-forwarded-for"));
	}
	const userAgent = headers.get("user-agent");
	return { ipAddress, userAgent };
}

const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const LAST_PRUNE_KEY = "activity_log_last_prune";

export async function pruneActivityLogsIfNeeded() {
	try {
		const [lastPrune, retentionRow] = await Promise.all([
			prisma.appSetting.findUnique({ where: { key: LAST_PRUNE_KEY } }),
			prisma.appSetting.findUnique({ where: { key: ACTIVITY_LOG_RETENTION_KEY } }),
		]);

		const now = Date.now();
		const lastPruneMs = lastPrune ? Number.parseInt(lastPrune.value, 10) : 0;
		if (Number.isFinite(lastPruneMs) && now - lastPruneMs < PRUNE_INTERVAL_MS) return;

		const retentionParsed = retentionRow ? Number.parseInt(retentionRow.value, 10) : Number.NaN;
		const days = Number.isInteger(retentionParsed)
			? retentionParsed
			: ACTIVITY_LOG_RETENTION_DEFAULT;
		const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);

		await prisma.$transaction([
			prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
			prisma.appSetting.upsert({
				where: { key: LAST_PRUNE_KEY },
				update: { value: String(now) },
				create: { key: LAST_PRUNE_KEY, value: String(now) },
			}),
		]);
	} catch (err) {
		console.error("activity-log prune failed", err);
	}
}
