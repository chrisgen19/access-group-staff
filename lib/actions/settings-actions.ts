"use server";

import { env } from "@/env";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
	TOP_RECOGNIZED_DEFAULT,
	TOP_RECOGNIZED_MAX,
	TOP_RECOGNIZED_MIN,
} from "@/lib/leaderboard/constants";
import {
	LEADERBOARD_VISIBILITY_MODES,
	type LeaderboardVisibilityMode,
	type LeaderboardVisibilitySettings,
	REVEAL_DAYS_DEFAULT,
	REVEAL_DAYS_MAX,
	REVEAL_DAYS_MIN,
} from "@/lib/leaderboard/visibility";

const OAUTH_KEYS = ["oauth_google_enabled", "oauth_microsoft_enabled"] as const;
type OAuthKey = (typeof OAUTH_KEYS)[number];

export type OAuthSettings = Record<OAuthKey, boolean>;

const CACHE_TTL_MS = 30_000;

const TOP_RECOGNIZED_KEY = "top_recognized_limit";

// Caches live on globalThis so they behave as a true process-wide singleton.
// Server Actions and Route Handlers can land in separate bundles with distinct
// module-scoped variables — a plain module-level `let` would mean the admin
// Server Action invalidates a different cache instance than the one readers
// (Route Handlers, Server Components) actually consult, leaking stale data for
// up to CACHE_TTL_MS after a settings change.
const globalForSettingsCache = globalThis as unknown as {
	oauthCache: { data: OAuthSettings | null; expiry: number };
	topLimitCache: { data: number | null; expiry: number };
	leaderboardCache: { data: LeaderboardVisibilitySettings | null; expiry: number };
};
globalForSettingsCache.oauthCache ??= { data: null, expiry: 0 };
globalForSettingsCache.topLimitCache ??= { data: null, expiry: 0 };
globalForSettingsCache.leaderboardCache ??= { data: null, expiry: 0 };
const oauthCache = globalForSettingsCache.oauthCache;
const topLimitCache = globalForSettingsCache.topLimitCache;
const leaderboardCache = globalForSettingsCache.leaderboardCache;

export async function getOAuthSettings(): Promise<OAuthSettings> {
	if (oauthCache.data && Date.now() < oauthCache.expiry) {
		return oauthCache.data;
	}

	const settings = await prisma.appSetting.findMany({
		where: { key: { in: [...OAUTH_KEYS] } },
	});

	const map = new Map(settings.map((s) => [s.key, s.value]));

	oauthCache.data = {
		oauth_google_enabled: map.get("oauth_google_enabled") !== "false",
		oauth_microsoft_enabled: map.get("oauth_microsoft_enabled") !== "false",
	};
	oauthCache.expiry = Date.now() + CACHE_TTL_MS;

	return oauthCache.data;
}

function invalidateOAuthCache() {
	oauthCache.data = null;
	oauthCache.expiry = 0;
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
	topLimitCache.data = null;
	topLimitCache.expiry = 0;
}

export async function getTopRecognizedLimit(): Promise<number> {
	if (topLimitCache.data !== null && Date.now() < topLimitCache.expiry) {
		return topLimitCache.data;
	}

	const row = await prisma.appSetting.findUnique({
		where: { key: TOP_RECOGNIZED_KEY },
	});

	const parsed = row ? Number.parseInt(row.value, 10) : Number.NaN;
	topLimitCache.data =
		Number.isNaN(parsed) || parsed < TOP_RECOGNIZED_MIN || parsed > TOP_RECOGNIZED_MAX
			? TOP_RECOGNIZED_DEFAULT
			: parsed;
	topLimitCache.expiry = Date.now() + CACHE_TTL_MS;

	return topLimitCache.data;
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

/* ── Leaderboard Visibility ──────────────────────────── */

const LEADERBOARD_MODE_KEY = "leaderboard_visibility_mode";
const LEADERBOARD_DAYS_KEY = "leaderboard_reveal_days";
const LEADERBOARD_CUSTOM_START_KEY = "leaderboard_custom_start";
const LEADERBOARD_CUSTOM_END_KEY = "leaderboard_custom_end";
const LEADERBOARD_KEYS = [
	LEADERBOARD_MODE_KEY,
	LEADERBOARD_DAYS_KEY,
	LEADERBOARD_CUSTOM_START_KEY,
	LEADERBOARD_CUSTOM_END_KEY,
];

function invalidateLeaderboardCache() {
	leaderboardCache.data = null;
	leaderboardCache.expiry = 0;
}

function isValidIsoDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	// Round-trip to reject impossible calendar dates like 2026-02-31.
	const parsed = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isLeaderboardMode(value: string): value is LeaderboardVisibilityMode {
	return (LEADERBOARD_VISIBILITY_MODES as string[]).includes(value);
}

export async function getLeaderboardVisibilitySettings(): Promise<LeaderboardVisibilitySettings> {
	if (leaderboardCache.data && Date.now() < leaderboardCache.expiry) {
		return leaderboardCache.data;
	}

	const rows = await prisma.appSetting.findMany({
		where: { key: { in: LEADERBOARD_KEYS } },
	});
	const map = new Map(rows.map((r) => [r.key, r.value]));

	const rawMode = map.get(LEADERBOARD_MODE_KEY) ?? "always";
	const mode: LeaderboardVisibilityMode = isLeaderboardMode(rawMode) ? rawMode : "always";

	const parsedDays = Number.parseInt(map.get(LEADERBOARD_DAYS_KEY) ?? "", 10);
	const revealDays =
		Number.isFinite(parsedDays) && parsedDays >= REVEAL_DAYS_MIN && parsedDays <= REVEAL_DAYS_MAX
			? parsedDays
			: REVEAL_DAYS_DEFAULT;

	const rawStart = map.get(LEADERBOARD_CUSTOM_START_KEY) ?? null;
	const rawEnd = map.get(LEADERBOARD_CUSTOM_END_KEY) ?? null;

	leaderboardCache.data = {
		mode,
		revealDays,
		customStart: rawStart && isValidIsoDate(rawStart) ? rawStart : null,
		customEnd: rawEnd && isValidIsoDate(rawEnd) ? rawEnd : null,
	};
	leaderboardCache.expiry = Date.now() + CACHE_TTL_MS;

	return leaderboardCache.data;
}

export interface UpdateLeaderboardVisibilityInput {
	mode: LeaderboardVisibilityMode;
	revealDays: number;
	customStart: string | null;
	customEnd: string | null;
}

export async function updateLeaderboardVisibilitySettings(
	input: UpdateLeaderboardVisibilityInput,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("ADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	if (!isLeaderboardMode(input.mode)) {
		return { success: false, error: "Invalid visibility mode" };
	}

	const revealDaysIsValid =
		Number.isInteger(input.revealDays) &&
		input.revealDays >= REVEAL_DAYS_MIN &&
		input.revealDays <= REVEAL_DAYS_MAX;

	// Only block the save on revealDays errors when the chosen mode actually
	// consumes that field. Otherwise an admin switching to `always` / `custom_range`
	// with a still-editing Reveal days input would be blocked on a now-hidden field.
	if (input.mode === "last_n_days_of_month" && !revealDaysIsValid) {
		return {
			success: false,
			error: `Reveal days must be between ${REVEAL_DAYS_MIN} and ${REVEAL_DAYS_MAX}`,
		};
	}

	if (input.mode === "custom_range") {
		if (
			!input.customStart ||
			!input.customEnd ||
			!isValidIsoDate(input.customStart) ||
			!isValidIsoDate(input.customEnd)
		) {
			return {
				success: false,
				error: "Custom range requires valid start and end dates",
			};
		}
		if (input.customStart > input.customEnd) {
			return {
				success: false,
				error: "Start date must be on or before end date",
			};
		}
	}

	const normalizedDays = revealDaysIsValid ? input.revealDays : REVEAL_DAYS_DEFAULT;
	const normalizedStart =
		input.customStart && isValidIsoDate(input.customStart) ? input.customStart : "";
	const normalizedEnd = input.customEnd && isValidIsoDate(input.customEnd) ? input.customEnd : "";

	await prisma.$transaction([
		prisma.appSetting.upsert({
			where: { key: LEADERBOARD_MODE_KEY },
			update: { value: input.mode },
			create: { key: LEADERBOARD_MODE_KEY, value: input.mode },
		}),
		prisma.appSetting.upsert({
			where: { key: LEADERBOARD_DAYS_KEY },
			update: { value: String(normalizedDays) },
			create: { key: LEADERBOARD_DAYS_KEY, value: String(normalizedDays) },
		}),
		prisma.appSetting.upsert({
			where: { key: LEADERBOARD_CUSTOM_START_KEY },
			update: { value: normalizedStart },
			create: { key: LEADERBOARD_CUSTOM_START_KEY, value: normalizedStart },
		}),
		prisma.appSetting.upsert({
			where: { key: LEADERBOARD_CUSTOM_END_KEY },
			update: { value: normalizedEnd },
			create: { key: LEADERBOARD_CUSTOM_END_KEY, value: normalizedEnd },
		}),
	]);

	invalidateLeaderboardCache();

	return { success: true };
}
