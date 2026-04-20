import type { ActivityAction, Prisma } from "@/app/generated/prisma/client";
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
			},
		});
	} catch (err) {
		console.error("activity-log write failed", {
			action: input.action,
			error: err instanceof Error ? err.message : String(err),
		});
	}
}

export function extractRequestMeta(headers: Headers) {
	const forwarded = headers.get("x-forwarded-for");
	const ipAddress = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
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
