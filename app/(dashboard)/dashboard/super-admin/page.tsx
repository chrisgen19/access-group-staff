import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import {
	getActivityLogRetentionDays,
	getOAuthProviderAvailability,
	getOAuthSettings,
} from "@/lib/actions/settings-actions";
import { requireRoleOrRedirect } from "@/lib/auth-utils";
import { ActivityLogRetentionPanel } from "./_components/activity-log-retention";
import { OAuthSettingsPanel } from "./_components/oauth-settings";

export default async function SuperAdminPage() {
	await requireRoleOrRedirect("SUPERADMIN");

	const [oauthSettings, providerAvailability, retentionDays] = await Promise.all([
		getOAuthSettings(),
		getOAuthProviderAvailability(),
		getActivityLogRetentionDays(),
	]);

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Administration"
				title="Super Admin"
				description="System-level administration and advanced controls."
			/>

			<OAuthSettingsPanel
				initialSettings={oauthSettings}
				providerAvailability={providerAvailability}
			/>

			<ActivityLogRetentionPanel initialDays={retentionDays} />
		</div>
	);
}
