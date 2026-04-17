import { z } from "zod";
import { getLeaderboardVisibilitySettings } from "@/lib/actions/settings-actions";
import { prisma } from "@/lib/db";
import { getCurrentMonthBoundaries, parseMonthKey } from "./month";
import { computeMonthRecipients, type SnapshotRecipient } from "./snapshot";
import { computeLeaderboardVisibility, type LeaderboardVisibilityState } from "./visibility";

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
			kind: "live";
			monthKey: string;
			recipients: SnapshotRecipient[];
			visibility: LeaderboardVisibilityState;
	  }
	| {
			kind: "locked";
			monthKey: string;
			visibility: LeaderboardVisibilityState;
	  }
	| {
			kind: "archived";
			monthKey: string;
			recipients: SnapshotRecipient[];
			snapshotAt: Date;
	  }
	| { kind: "missing"; monthKey: string };

export async function getArchivedMonthKeys(): Promise<string[]> {
	const rows = await prisma.monthlyLeaderboardSnapshot.findMany({
		select: { month: true },
		orderBy: { month: "desc" },
	});
	return rows.map((r) => r.month);
}

export async function getMonthLeaderboard(
	monthKey: string,
	now: Date = new Date(),
	limit = 50,
): Promise<MonthLeaderboard> {
	const currentKey = getCurrentMonthBoundaries(now).monthKey;

	if (monthKey === currentKey) {
		const settings = await getLeaderboardVisibilitySettings();
		const visibility = computeLeaderboardVisibility(settings, now);
		if (!visibility.visible) {
			return { kind: "locked", monthKey, visibility };
		}
		const recipients = await computeMonthRecipients(monthKey, limit);
		return { kind: "live", monthKey, recipients, visibility };
	}

	const snapshot = await prisma.monthlyLeaderboardSnapshot.findUnique({
		where: { month: monthKey },
	});
	if (!snapshot) {
		return { kind: "missing", monthKey };
	}

	const parsed = SnapshotPayloadSchema.safeParse(snapshot.recipients);
	if (!parsed.success) {
		return { kind: "missing", monthKey };
	}

	// Snapshots are written at TOP_RECOGNIZED_MAX; trim to the active limit so
	// archive display matches the current admin setting.
	return {
		kind: "archived",
		monthKey,
		recipients: parsed.data.slice(0, limit),
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
