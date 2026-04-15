"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { env } from "@/env";

const OAUTH_KEYS = ["oauth_google_enabled", "oauth_microsoft_enabled"] as const;
type OAuthKey = (typeof OAUTH_KEYS)[number];

export type OAuthSettings = Record<OAuthKey, boolean>;

let cachedSettings: OAuthSettings | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000;

const TOP_RECOGNIZED_KEY = "top_recognized_limit";
const TOP_RECOGNIZED_DEFAULT = 10;
const TOP_RECOGNIZED_MIN = 1;
const TOP_RECOGNIZED_MAX = 50;

let cachedTopLimit: number | null = null;
let topLimitCacheExpiry = 0;

export async function getOAuthSettings(): Promise<OAuthSettings> {
	if (cachedSettings && Date.now() < cacheExpiry) {
		return cachedSettings;
	}

	const settings = await prisma.appSetting.findMany({
		where: { key: { in: [...OAUTH_KEYS] } },
	});

	const map = new Map(settings.map((s) => [s.key, s.value]));

	cachedSettings = {
		oauth_google_enabled: map.get("oauth_google_enabled") !== "false",
		oauth_microsoft_enabled: map.get("oauth_microsoft_enabled") !== "false",
	};
	cacheExpiry = Date.now() + CACHE_TTL_MS;

	return cachedSettings;
}

function invalidateOAuthCache() {
	cachedSettings = null;
	cacheExpiry = 0;
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
	cachedTopLimit = null;
	topLimitCacheExpiry = 0;
}

export async function getTopRecognizedLimit(): Promise<number> {
	if (cachedTopLimit !== null && Date.now() < topLimitCacheExpiry) {
		return cachedTopLimit;
	}

	const row = await prisma.appSetting.findUnique({
		where: { key: TOP_RECOGNIZED_KEY },
	});

	const parsed = row ? Number.parseInt(row.value, 10) : Number.NaN;
	cachedTopLimit =
		Number.isNaN(parsed) || parsed < TOP_RECOGNIZED_MIN || parsed > TOP_RECOGNIZED_MAX
			? TOP_RECOGNIZED_DEFAULT
			: parsed;
	topLimitCacheExpiry = Date.now() + CACHE_TTL_MS;

	return cachedTopLimit;
}

export async function updateTopRecognizedLimit(
	limit: number,
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireRole("ADMIN");
	} catch {
		return { success: false, error: "Unauthorized" };
	}

	if (
		!Number.isInteger(limit) ||
		limit < TOP_RECOGNIZED_MIN ||
		limit > TOP_RECOGNIZED_MAX
	) {
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
