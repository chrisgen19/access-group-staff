import { Lock, Medal, Trophy } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatMonthLabel, type MonthLeaderboard } from "@/lib/leaderboard/history";
import { cn } from "@/lib/utils";

const PODIUM_STYLES = [
	{
		ring: "ring-2 ring-amber-400/60",
		bg: "bg-amber-50 dark:bg-amber-400/15",
		text: "text-amber-600 dark:text-amber-400",
		medal: "text-amber-500",
		countBg: "bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400",
	},
	{
		ring: "ring-2 ring-gray-300/80 dark:ring-gray-400/40",
		bg: "bg-gray-100 dark:bg-gray-400/15",
		text: "text-gray-500 dark:text-gray-300",
		medal: "text-gray-400 dark:text-gray-300",
		countBg: "bg-gray-100 dark:bg-gray-400/10 text-gray-500 dark:text-gray-300",
	},
	{
		ring: "ring-2 ring-orange-400/50 dark:ring-orange-500/40",
		bg: "bg-orange-50 dark:bg-orange-400/15",
		text: "text-orange-600 dark:text-orange-400",
		medal: "text-orange-500 dark:text-orange-400",
		countBg: "bg-orange-50 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400",
	},
] as const;

const REVEAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-AU", {
	timeZone: "Asia/Manila",
	month: "short",
	day: "numeric",
});

const SNAPSHOT_DATE_FORMATTER = new Intl.DateTimeFormat("en-AU", {
	timeZone: "Asia/Manila",
	dateStyle: "medium",
});

function formatRevealRange(start: Date, end: Date): string {
	// revealEnd is exclusive — subtract 1ms to display the inclusive last day.
	const lastDay = new Date(end.getTime() - 1);
	return `${REVEAL_DATE_FORMATTER.format(start)} – ${REVEAL_DATE_FORMATTER.format(lastDay)}`;
}

function PanelShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
			{children}
		</div>
	);
}

function EmptyMessage({ title, body }: { title: string; body?: string }) {
	return (
		<PanelShell>
			<div className="flex flex-col items-center justify-center px-8 py-16 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
					<Trophy size={22} className="text-primary" />
				</div>
				<p className="text-base font-medium text-foreground">{title}</p>
				{body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
			</div>
		</PanelShell>
	);
}

export function LeaderboardList({ data }: { data: MonthLeaderboard }) {
	if (data.kind === "missing") {
		return (
			<EmptyMessage
				title={`No snapshot for ${formatMonthLabel(data.monthKey)}`}
				body="This month isn't archived. It may predate the archive feature."
			/>
		);
	}

	if (data.kind === "locked") {
		const { revealStart, revealEnd } = data.visibility;
		const rangeLabel = revealStart && revealEnd ? formatRevealRange(revealStart, revealEnd) : null;
		return (
			<PanelShell>
				<div className="flex flex-col items-center justify-center px-8 py-16 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
						<Lock size={22} className="text-primary" />
					</div>
					<p className="text-base font-medium text-foreground">
						{rangeLabel ? "Rankings revealed" : "Rankings hidden"}
					</p>
					{rangeLabel && <p className="mt-1 text-sm text-muted-foreground">{rangeLabel}</p>}
					<p className="mt-4 text-xs text-muted-foreground">
						This month's leaderboard is not yet visible.
					</p>
				</div>
			</PanelShell>
		);
	}

	const { recipients } = data;
	const isLive = data.kind === "live";
	const badge = isLive ? "Live" : `Archived ${SNAPSHOT_DATE_FORMATTER.format(data.snapshotAt)}`;

	if (recipients.length === 0) {
		return (
			<EmptyMessage
				title={`No recognitions in ${formatMonthLabel(data.monthKey)}`}
				body={isLive ? "Be the first to recognize a colleague this month!" : undefined}
			/>
		);
	}

	return (
		<PanelShell>
			<div className="px-6 py-6 sm:px-8 sm:py-8">
				<div className="flex flex-wrap items-center gap-3 mb-6">
					<Trophy size={20} className="text-primary" />
					<h2 className="text-[1.25rem] font-medium text-foreground tracking-tight">
						Most Recognized — {formatMonthLabel(data.monthKey)}
					</h2>
					<span
						className={cn(
							"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
							isLive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
						)}
					>
						{badge}
					</span>
				</div>

				<ol className="space-y-2">
					{recipients.map((person, index) => {
						const isPodium = index < 3;
						const style = isPodium ? PODIUM_STYLES[index] : null;

						return (
							<li
								key={person.userId}
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
									isPodium
										? "bg-card border border-gray-200/60 dark:border-white/10 shadow-sm"
										: "px-3 py-2",
								)}
							>
								{isPodium ? (
									<Medal size={18} className={cn("shrink-0", style?.medal)} />
								) : (
									<span className="w-[18px] text-xs font-semibold text-muted-foreground text-center shrink-0">
										{person.rank}
									</span>
								)}
								<UserAvatar
									firstName={person.firstName}
									lastName={person.lastName}
									avatar={person.avatar}
									size={isPodium ? "md" : "sm"}
									className={cn(
										isPodium
											? cn(style?.ring, style?.bg, style?.text)
											: "bg-primary/10 text-primary",
									)}
								/>
								<span
									className={cn(
										"flex-1 truncate",
										isPodium
											? "text-sm font-semibold text-foreground"
											: "text-sm font-medium text-foreground",
									)}
								>
									{person.firstName} {person.lastName}
								</span>
								<span
									className={cn(
										"shrink-0 text-sm font-bold tabular-nums",
										isPodium ? cn("rounded-full px-2.5 py-0.5", style?.countBg) : "text-primary",
									)}
								>
									{person.count}
								</span>
							</li>
						);
					})}
				</ol>
			</div>
		</PanelShell>
	);
}
