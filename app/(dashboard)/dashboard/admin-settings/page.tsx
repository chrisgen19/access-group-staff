import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import {
	getHelpMeEnabled,
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireRoleOrRedirect } from "@/lib/auth-utils";
import { HelpMeVisibilityPanel } from "./_components/helpme-visibility";
import { LeaderboardVisibilityPanel } from "./_components/leaderboard-visibility";
import { RecognitionSettingsPanel } from "./_components/recognition-settings";

export default async function AdminSettingsPage() {
	await requireRoleOrRedirect("ADMIN");

	const [topLimit, visibility, helpMeEnabled] = await Promise.all([
		getTopRecognizedLimit(),
		getLeaderboardVisibilitySettings(),
		getHelpMeEnabled(),
	]);

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Administration"
				title="Admin Settings"
				description="Manage application settings and configurations."
			/>

			<RecognitionSettingsPanel initialLimit={topLimit} />

			<LeaderboardVisibilityPanel
				initialStartDay={visibility.revealStartDay}
				initialEndDay={visibility.revealEndDay}
			/>

			<HelpMeVisibilityPanel initialEnabled={helpMeEnabled} />
		</div>
	);
}
