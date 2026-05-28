import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getTopRecognizedLimit } from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import {
	formatMonthLabel,
	getArchivedMonthKeys,
	getMonthLeaderboard,
	isValidMonthKey,
} from "@/lib/leaderboard/history";
import { getCurrentMonthBoundaries } from "@/lib/leaderboard/month";
import { maybeSnapshotPreviousMonth } from "@/lib/leaderboard/snapshot";
import { LeaderboardList } from "./_components/leaderboard-list";
import { MonthPicker } from "./_components/month-picker";

interface PageProps {
	searchParams: Promise<{ month?: string }>;
}

function PageHeader() {
	return (
		<DashboardPageHeader
			eyebrow="Recognition"
			title="Leaderboard"
			description="Most Recognized rankings, preserved month by month."
		/>
	);
}

export default async function LeaderboardHistoryPage({ searchParams }: PageProps) {
	try {
		await requireSession();
	} catch {
		redirect("/login");
	}

	const { month: monthParam } = await searchParams;
	const now = new Date();

	// Self-heal the archive when a user lands here before anyone hits
	// /dashboard post-rollover. A failure must not break the page render, but
	// log it rather than swallowing silently.
	await maybeSnapshotPreviousMonth(now).catch((err) => {
		console.error("maybeSnapshotPreviousMonth failed", { error: err });
	});

	const [archivedKeys, topLimit] = await Promise.all([
		getArchivedMonthKeys(),
		getTopRecognizedLimit(),
	]);

	const currentMonthKey = getCurrentMonthBoundaries(now).monthKey;

	// Completed months are always browsable. The in-progress month is never
	// listed (it's still being counted) — filter it out defensively.
	const selectableKeys = archivedKeys.filter((k) => k !== currentMonthKey);

	const requested = monthParam && isValidMonthKey(monthParam) ? monthParam : null;

	// Generic empty state only when there's nothing archived AND the user didn't
	// deep-link a specific month. A valid ?month= flows through so locked/missing
	// states surface for shared or bookmarked links even before any archive exists.
	if (selectableKeys.length === 0 && !requested) {
		return (
			<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
				<PageHeader />
				<div className="rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 bg-muted/30 px-8 py-16 text-center">
					<p className="text-base font-medium text-foreground">No leaderboards to show yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Archives appear here after each month ends.
					</p>
				</div>
			</div>
		);
	}

	// Honor a valid requested month even if it isn't in the selectable list
	// (e.g. the current in-progress month, or a pre-archive month) so locked /
	// missing states surface for shared or bookmarked links instead of silently
	// falling back to selectableKeys[0].
	const selectedKey = requested ?? selectableKeys[0];
	const baseItems = selectableKeys.map((key) => ({
		key,
		label: formatMonthLabel(key),
	}));
	const items = selectableKeys.includes(selectedKey)
		? baseItems
		: [{ key: selectedKey, label: formatMonthLabel(selectedKey) }, ...baseItems];
	const data = await getMonthLeaderboard(selectedKey, now, topLimit);

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<PageHeader />
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
				<span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					Showing
				</span>
				<MonthPicker items={items} selected={selectedKey} />
			</div>
			<LeaderboardList data={data} />
		</div>
	);
}
