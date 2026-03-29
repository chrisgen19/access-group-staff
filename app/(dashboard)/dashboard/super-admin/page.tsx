import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getOAuthSettings, getOAuthProviderAvailability } from "@/lib/actions/settings-actions";
import { OAuthSettingsPanel } from "./_components/oauth-settings";

export default async function SuperAdminPage() {
	try {
		await requireRole("SUPERADMIN");
	} catch {
		redirect("/dashboard");
	}

	const oauthSettings = await getOAuthSettings();
	const providerAvailability = await getOAuthProviderAvailability();

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Super Admin
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					System-level administration and advanced controls.
				</p>
			</div>

			<OAuthSettingsPanel initialSettings={oauthSettings} providerAvailability={providerAvailability} />
		</div>
	);
}
