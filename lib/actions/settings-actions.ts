"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";

const OAUTH_KEYS = ["oauth_google_enabled", "oauth_microsoft_enabled"] as const;
type OAuthKey = (typeof OAUTH_KEYS)[number];

export type OAuthSettings = Record<OAuthKey, boolean>;

export async function getOAuthSettings(): Promise<OAuthSettings> {
	const settings = await prisma.appSetting.findMany({
		where: { key: { in: [...OAUTH_KEYS] } },
	});

	const map = new Map(settings.map((s) => [s.key, s.value]));

	return {
		oauth_google_enabled: map.get("oauth_google_enabled") === "true",
		oauth_microsoft_enabled: map.get("oauth_microsoft_enabled") === "true",
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

	return { success: true };
}
