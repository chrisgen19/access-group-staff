"use server";

import { env } from "@/env";
import {
	ACTIVITY_LOG_RETENTION_DEFAULT,
	ACTIVITY_LOG_RETENTION_KEY,
	ACTIVITY_LOG_RETENTION_MAX,
	ACTIVITY_LOG_RETENTION_MIN,
} from "@/lib/activity-log-retention";
import { requireRole } from "@/lib/auth-utils";
import {
	getOrCreateGlobalEntry,
	invalidateEntry,
	readThroughCache,
} from "@/lib/cache/settings-cache";
import { prisma } from "@/lib/db";
import {
	TOP_RECOGNIZED_DEFAULT,
	TOP_RECOGNIZED_MAX,
	TOP_RECOGNIZED_MIN,
} from "@/lib/leaderboard/constants";
import {
	type LeaderboardVisibilitySettings,
	REVEAL_DAY_MAX,
	REVEAL_DAY_MIN,
	REVEAL_END_DAY_DEFAULT,
	REVEAL_START_DAY_DEFAULT,
} from "@/lib/leaderboard/visibility";

const OAUTH_KEYS = ["oauth_google_enabled", "oauth_microsoft_enabled"] as const;
type OAuthKey = (typeof OAUTH_KEYS)[number];

export type OAuthSettings = Record<OAuthKey, boolean>;

const CACHE_TTL_MS = 30_000;

const TOP_RECOGNIZED_KEY = "top_recognized_limit";
const HELPME_MODULE_KEY = "helpme_module_enabled";

const oauthCache = getOrCreateGlobalEntry<OAuthSettings>("accessGroupStaff.settings.oauth");
const topLimitCache = getOrCreateGlobalEntry<number>(
	"accessGroupStaff.settings.topRecognizedLimit",
);
const leaderboardCache = getOrCreateGlobalEntry<LeaderboardVisibilitySettings>(
	"accessGroupStaff.settings.leaderboardVisibility",
);
const helpMeCache = getOrCreateGlobalEntry<boolean>("accessGroupStaff.settings.helpMeEnabled");

export async function getOAuthSettings(): Promise<OAuthSettings> {
	return readThroughCache(oauthCache, CACHE_TTL_MS, async () => {
		const settings = await prisma.appSetting.findMany({
			where: { key: { in: [...OAUTH_KEYS] } },
		});
		const map = new Map(settings.map((s) => [s.key, s.value]));
		return {
			oauth_google_enabled: map.get("oauth_google_enabled") !== "false",
			oauth_microsoft_enabled: map.get("oauth_microsoft_enabled") !== "false",
		};
	});
}

function invalidateOAuthCache() {
	invalidateEntry(oauthCache);
}

export async function getOAuthProviderAvailability() {
	return {
		google: true,
		microsoft: !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET),
	};
}

export async function updateOAuthSetting(
	key: OAuthKey,
	enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("SUPERADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	if (!OAUTH_KEYS.includes(key)) {
		return { success: false, error: "Invalid setting key" };
	}

	await prisma.appSetting.upsert({
		where: { key },
		update: { value: String(enabled) },
		create: { key, value: String(enabled) },
	});

	invalidateOAuthCache();

	return { success: true };
}

/* ── Top Recognized Limit ────────────────────────────── */

function invalidateTopLimitCache() {
	invalidateEntry(topLimitCache);
}

export async function getTopRecognizedLimit(): Promise<number> {
	return readThroughCache(topLimitCache, CACHE_TTL_MS, async () => {
		const row = await prisma.appSetting.findUnique({
			where: { key: TOP_RECOGNIZED_KEY },
		});
		const parsed = row ? Number.parseInt(row.value, 10) : Number.NaN;
		return Number.isNaN(parsed) || parsed < TOP_RECOGNIZED_MIN || parsed > TOP_RECOGNIZED_MAX
			? TOP_RECOGNIZED_DEFAULT
			: parsed;
	});
}

export async function updateTopRecognizedLimit(
	limit: number,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("ADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	if (!Number.isInteger(limit) || limit < TOP_RECOGNIZED_MIN || limit > TOP_RECOGNIZED_MAX) {
		return {
			success: false,
			error: `Limit must be between ${TOP_RECOGNIZED_MIN} and ${TOP_RECOGNIZED_MAX}`,
		};
	}

	await prisma.appSetting.upsert({
		where: { key: TOP_RECOGNIZED_KEY },
		update: { value: String(limit) },
		create: { key: TOP_RECOGNIZED_KEY, value: String(limit) },
	});

	invalidateTopLimitCache();

	return { success: true };
}

/* ── Activity Log Retention ──────────────────────────── */

export async function getActivityLogRetentionDays(): Promise<number> {
	const row = await prisma.appSetting.findUnique({
		where: { key: ACTIVITY_LOG_RETENTION_KEY },
	});
	const parsed = row ? Number.parseInt(row.value, 10) : Number.NaN;
	return Number.isInteger(parsed) &&
		parsed >= ACTIVITY_LOG_RETENTION_MIN &&
		parsed <= ACTIVITY_LOG_RETENTION_MAX
		? parsed
		: ACTIVITY_LOG_RETENTION_DEFAULT;
}

export async function updateActivityLogRetentionDays(
	days: number,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("SUPERADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	if (
		!Number.isInteger(days) ||
		days < ACTIVITY_LOG_RETENTION_MIN ||
		days > ACTIVITY_LOG_RETENTION_MAX
	) {
		return {
			success: false,
			error: `Retention must be between ${ACTIVITY_LOG_RETENTION_MIN} and ${ACTIVITY_LOG_RETENTION_MAX} days`,
		};
	}

	await prisma.appSetting.upsert({
		where: { key: ACTIVITY_LOG_RETENTION_KEY },
		update: { value: String(days) },
		create: { key: ACTIVITY_LOG_RETENTION_KEY, value: String(days) },
	});

	return { success: true };
}

/* ── Help Me Module Toggle ───────────────────────────── */

function invalidateHelpMeCache() {
	invalidateEntry(helpMeCache);
}

export async function getHelpMeEnabled(): Promise<boolean> {
	return readThroughCache(helpMeCache, CACHE_TTL_MS, async () => {
		const row = await prisma.appSetting.findUnique({
			where: { key: HELPME_MODULE_KEY },
		});
		// Default to enabled when the row is missing or holds an unexpected value.
		return row?.value !== "false";
	});
}

export async function updateHelpMeEnabled(
	enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("ADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	await prisma.appSetting.upsert({
		where: { key: HELPME_MODULE_KEY },
		update: { value: String(enabled) },
		create: { key: HELPME_MODULE_KEY, value: String(enabled) },
	});

	invalidateHelpMeCache();

	return { success: true };
}

/* ── Leaderboard Visibility ──────────────────────────── */

const LEADERBOARD_START_DAY_KEY = "leaderboard_reveal_start_day";
const LEADERBOARD_END_DAY_KEY = "leaderboard_reveal_end_day";
const LEADERBOARD_KEYS = [LEADERBOARD_START_DAY_KEY, LEADERBOARD_END_DAY_KEY];

function invalidateLeaderboardCache() {
	invalidateEntry(leaderboardCache);
}

function parseDay(raw: string | undefined, fallback: number): number {
	const parsed = Number.parseInt(raw ?? "", 10);
	return Number.isInteger(parsed) && parsed >= REVEAL_DAY_MIN && parsed <= REVEAL_DAY_MAX
		? parsed
		: fallback;
}

export async function getLeaderboardVisibilitySettings(): Promise<LeaderboardVisibilitySettings> {
	return readThroughCache(leaderboardCache, CACHE_TTL_MS, async () => {
		const rows = await prisma.appSetting.findMany({
			where: { key: { in: LEADERBOARD_KEYS } },
		});
		const map = new Map(rows.map((r) => [r.key, r.value]));

		const revealStartDay = parseDay(map.get(LEADERBOARD_START_DAY_KEY), REVEAL_START_DAY_DEFAULT);
		const revealEndDay = Math.max(
			revealStartDay,
			parseDay(map.get(LEADERBOARD_END_DAY_KEY), REVEAL_END_DAY_DEFAULT),
		);

		return { revealStartDay, revealEndDay };
	});
}

export interface UpdateLeaderboardVisibilityInput {
	revealStartDay: number;
	revealEndDay: number;
}

export async function updateLeaderboardVisibilitySettings(
	input: UpdateLeaderboardVisibilityInput,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("ADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	const dayIsValid = (day: number) =>
		Number.isInteger(day) && day >= REVEAL_DAY_MIN && day <= REVEAL_DAY_MAX;

	if (!dayIsValid(input.revealStartDay) || !dayIsValid(input.revealEndDay)) {
		return {
			success: false,
			error: `Reveal days must be between ${REVEAL_DAY_MIN} and ${REVEAL_DAY_MAX}`,
		};
	}

	if (input.revealStartDay > input.revealEndDay) {
		return {
			success: false,
			error: "Reveal start day must be on or before the end day",
		};
	}

	await prisma.$transaction([
		prisma.appSetting.upsert({
			where: { key: LEADERBOARD_START_DAY_KEY },
			update: { value: String(input.revealStartDay) },
			create: { key: LEADERBOARD_START_DAY_KEY, value: String(input.revealStartDay) },
		}),
		prisma.appSetting.upsert({
			where: { key: LEADERBOARD_END_DAY_KEY },
			update: { value: String(input.revealEndDay) },
			create: { key: LEADERBOARD_END_DAY_KEY, value: String(input.revealEndDay) },
		}),
	]);

	invalidateLeaderboardCache();

	return { success: true };
}
