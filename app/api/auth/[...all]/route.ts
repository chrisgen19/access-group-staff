import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { getOAuthProviderAvailability, getOAuthSettings } from "@/lib/actions/settings-actions";
import { auth } from "@/lib/auth";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

const PROVIDER_SETTING_MAP: Record<string, keyof Awaited<ReturnType<typeof getOAuthSettings>>> = {
	google: "oauth_google_enabled",
	microsoft: "oauth_microsoft_enabled",
};

async function checkOAuthAllowed(request: NextRequest): Promise<Response | null> {
	const pathname = request.nextUrl.pathname;

	const providerMatch = pathname.match(
		/\/api\/auth\/(?:callback|sign-in\/social|link-social)\/?(.*)?/,
	);
	if (!providerMatch) return null;

	const body =
		request.method === "POST"
			? await request
					.clone()
					.json()
					.catch(() => null)
			: null;
	const provider = providerMatch[1] || (body as Record<string, unknown> | null)?.provider;

	if (typeof provider !== "string" || !(provider in PROVIDER_SETTING_MAP)) return null;

	const availability = await getOAuthProviderAvailability();
	const availabilityKey = provider as keyof typeof availability;
	if (!availability[availabilityKey]) {
		return Response.json(
			{ success: false, error: `${provider} OAuth is not configured` },
			{ status: 403 },
		);
	}

	const settings = await getOAuthSettings();
	const settingKey = PROVIDER_SETTING_MAP[provider];
	if (!settings[settingKey]) {
		return Response.json(
			{ success: false, error: `${provider} OAuth is currently disabled` },
			{ status: 403 },
		);
	}

	return null;
}

export async function GET(request: NextRequest) {
	const blocked = await checkOAuthAllowed(request);
	if (blocked) return blocked;
	return authGET(request);
}

export async function POST(request: NextRequest) {
	const blocked = await checkOAuthAllowed(request);
	if (blocked) return blocked;
	return authPOST(request);
}
