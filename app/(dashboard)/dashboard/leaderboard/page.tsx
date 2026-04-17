import { redirect } from "next/navigation";
import {
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import {
	formatMonthLabel,
	getArchivedMonthKeys,
	getMonthLeaderboard,
	isValidMonthKey,
} from "@/lib/leaderboard/history";
import { getCurrentMonthBoundaries } from "@/lib/leaderboard/month";
import { maybeSnapshotPreviousMonth } from "@/lib/leaderboard/snapshot";
import { computeLeaderboardVisibility } from "@/lib/leaderboard/visibility";
import { LeaderboardList } from "./_components/leaderboard-list";
import { MonthPicker } from "./_components/month-picker";

interface PageProps {
	searchParams: Promise<{ month?: string }>;
}

function PageHeader() {
	return (
		<div>
			<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
				Leaderboard
			</h1>
			<p className="mt-2 text-base text-muted-foreground">
				Most Recognized rankings, preserved month by month.
			</p>
		</div>
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
	// /dashboard post-rollover. Swallow errors so snapshot failures don't
	// break the page render.
	await maybeSnapshotPreviousMonth(now).catch(() => {});

	const [archivedKeys, settings, topLimit] = await Promise.all([
		getArchivedMonthKeys(),
		getLeaderboardVisibilitySettings(),
		getTopRecognizedLimit(),
	]);

	const currentMonthKey = getCurrentMonthBoundaries(now).monthKey;
	const visibility = computeLeaderboardVisibility(settings, now);

	// Archived list may include the current month if this process already wrote
	// it (it shouldn't — we only snapshot the previous month — but filter defensively).
	const archived = archivedKeys.filter((k) => k !== currentMonthKey);
	const selectableKeys = visibility.visible ? [currentMonthKey, ...archived] : archived;

	const requested = monthParam && isValidMonthKey(monthParam) ? monthParam : null;

	// Generic empty state only when there's truly nothing to show AND the user
	// didn't deep-link a specific month. A valid ?month= flows through below so
	// locked/missing states surface for shared or bookmarked links even before
	// the first archive exists.
	if (selectableKeys.length === 0 && !requested) {
		return (
			<div className="max-w-7xl mx-auto mt-2 space-y-8">
				<PageHeader />
				<div className="rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 bg-muted/30 px-8 py-16 text-center">
					<p className="text-base font-medium text-foreground">No leaderboards to show yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Archives appear here after each month ends. The current month becomes available when its
						reveal window opens.
					</p>
				</div>
			</div>
		);
	}

	// Honor a valid requested month even if it isn't in the selectable list
	// (e.g. pre-archive months, the just-finished month before its snapshot
	// lands, or the current month while hidden). This lets locked/missing
	// states surface for shared/bookmarked links instead of silently falling
	// back to selectableKeys[0].
	const selectedKey = requested ?? selectableKeys[0];
	const baseItems = selectableKeys.map((key) => ({
		key,
		label:
			key === currentMonthKey && visibility.visible
				? `${formatMonthLabel(key)} (live)`
				: formatMonthLabel(key),
	}));
	const items = selectableKeys.includes(selectedKey)
		? baseItems
		: [{ key: selectedKey, label: formatMonthLabel(selectedKey) }, ...baseItems];
	const data = await getMonthLeaderboard(selectedKey, now, topLimit);

	return (
		<div className="max-w-7xl mx-auto mt-2 space-y-8">
			<PageHeader />
			<div className="flex flex-wrap items-center gap-3">
				<span className="text-sm text-muted-foreground">Showing:</span>
				<MonthPicker items={items} selected={selectedKey} />
			</div>
			<LeaderboardList data={data} />
		</div>
	);
}
