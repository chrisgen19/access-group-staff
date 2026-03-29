import { NextResponse } from "next/server";
import { getOAuthSettings, getOAuthProviderAvailability } from "@/lib/actions/settings-actions";

export async function GET() {
	const settings = await getOAuthSettings();
	const availability = getOAuthProviderAvailability();
	return NextResponse.json({ success: true, data: settings, availability });
}
