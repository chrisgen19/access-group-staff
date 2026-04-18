import { NextResponse } from "next/server";
import { getOAuthProviderAvailability, getOAuthSettings } from "@/lib/actions/settings-actions";

export async function GET() {
	const settings = await getOAuthSettings();
	const availability = await getOAuthProviderAvailability();
	return NextResponse.json({ success: true, data: settings, availability });
}
