import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentMonthBoundaries, parseMonthKey } from "./month";
import type { SnapshotRecipient } from "./snapshot";

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonthKey(value: string): boolean {
	if (!MONTH_KEY_REGEX.test(value)) return false;
	try {
		parseMonthKey(value);
		return true;
	} catch {
		return false;
	}
}

const SnapshotRecipientSchema = z.object({
	userId: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	avatar: z.string().nullable(),
	count: z.number().int().nonnegative(),
	rank: z.number().int().positive(),
});
const SnapshotPayloadSchema = z.array(SnapshotRecipientSchema);

export type MonthLeaderboard =
	| {
			kind: "archived";
			monthKey: string;
			recipients: SnapshotRecipient[];
			snapshotAt: Date;
	  }
	| { kind: "locked"; monthKey: string }
	| { kind: "missing"; monthKey: string };

export async function getArchivedMonthKeys(): Promise<string[]> {
	const rows = await prisma.monthlyLeaderboardSnapshot.findMany({
		select: { month: true },
		orderBy: { month: "desc" },
	});
	return rows.map((r) => r.month);
}

function parseSnapshotRecipients(value: unknown): SnapshotRecipient[] | null {
	const parsed = SnapshotPayloadSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

// Reads a completed month's archived winners, trimmed to `limit`. Returns null
// when no valid snapshot exists for the month.
export async function getArchivedRecipients(
	monthKey: string,
	limit: number,
): Promise<SnapshotRecipient[] | null> {
	const snapshot = await prisma.monthlyLeaderboardSnapshot.findUnique({
		where: { month: monthKey },
		select: { recipients: true },
	});
	if (!snapshot) return null;
	const recipients = parseSnapshotRecipients(snapshot.recipients);
	return recipients ? recipients.slice(0, limit) : null;
}

export async function getMonthLeaderboard(
	monthKey: string,
	now: Date = new Date(),
	limit = 50,
): Promise<MonthLeaderboard> {
	const currentKey = getCurrentMonthBoundaries(now).monthKey;

	// The in-progress month is never shown — its data is still being counted.
	if (monthKey === currentKey) {
		return { kind: "locked", monthKey };
	}

	const snapshot = await prisma.monthlyLeaderboardSnapshot.findUnique({
		where: { month: monthKey },
	});
	if (!snapshot) {
		return { kind: "missing", monthKey };
	}

	const recipients = parseSnapshotRecipients(snapshot.recipients);
	if (!recipients) {
		return { kind: "missing", monthKey };
	}

	// Snapshots are written at TOP_RECOGNIZED_MAX; trim to the active limit so
	// archive display matches the current admin setting.
	return {
		kind: "archived",
		monthKey,
		recipients: recipients.slice(0, limit),
		snapshotAt: snapshot.snapshotAt,
	};
}

export function formatMonthLabel(monthKey: string): string {
	const { year, month } = parseMonthKey(monthKey);
	// Mid-month UTC avoids tz-shift flipping the rendered month name.
	const date = new Date(Date.UTC(year, month, 15));
	return new Intl.DateTimeFormat("en-AU", {
		month: "long",
		year: "numeric",
	}).format(date);
}
