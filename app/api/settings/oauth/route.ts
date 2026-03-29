import { NextResponse } from "next/server";
import { getOAuthSettings } from "@/lib/actions/settings-actions";

export async function GET() {
	const settings = await getOAuthSettings();
	return NextResponse.json({ success: true, data: settings });
}
