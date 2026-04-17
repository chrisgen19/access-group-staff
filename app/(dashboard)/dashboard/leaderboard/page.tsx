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

	if (selectableKeys.length === 0) {
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

	const requested = monthParam && isValidMonthKey(monthParam) ? monthParam : null;
	const selectedKey =
		requested && selectableKeys.includes(requested) ? requested : selectableKeys[0];
	const items = selectableKeys.map((key) => ({
		key,
		label: formatMonthLabel(key),
		isCurrent: key === currentMonthKey,
	}));
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
