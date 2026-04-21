import { redirect } from "next/navigation";
import {
	getHelpMeEnabled,
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireRole } from "@/lib/auth-utils";
import { HelpMeVisibilityPanel } from "./_components/helpme-visibility";
import { LeaderboardVisibilityPanel } from "./_components/leaderboard-visibility";
import { RecognitionSettingsPanel } from "./_components/recognition-settings";

export default async function AdminSettingsPage() {
	try {
		await requireRole("ADMIN");
	} catch {
		redirect("/dashboard");
	}

	const [topLimit, visibility, helpMeEnabled] = await Promise.all([
		getTopRecognizedLimit(),
		getLeaderboardVisibilitySettings(),
		getHelpMeEnabled(),
	]);

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Admin Settings
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Manage application settings and configurations.
				</p>
			</div>

			<RecognitionSettingsPanel initialLimit={topLimit} />

			<LeaderboardVisibilityPanel
				initialMode={visibility.mode}
				initialDays={visibility.revealDays}
				initialCustomStart={visibility.customStart}
				initialCustomEnd={visibility.customEnd}
			/>

			<HelpMeVisibilityPanel initialEnabled={helpMeEnabled} />
		</div>
	);
}
