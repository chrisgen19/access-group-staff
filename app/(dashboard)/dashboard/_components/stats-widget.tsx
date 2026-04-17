"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Heart, Inbox, Lock, Medal, Send, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
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

type LeaderboardVisibilityMode = "always" | "last_n_days_of_month" | "custom_range";

interface LeaderboardVisibility {
	visible: boolean;
	mode: LeaderboardVisibilityMode;
	revealStart: string | null;
	revealEnd: string | null;
}

interface StatsData {
	sent: number;
	received: number;
	monthlyTotal: number;
	topRecipients: {
		firstName: string;
		lastName: string;
		avatar: string | null;
		count: number;
	}[];
	leaderboardVisibility: LeaderboardVisibility;
}

const REVEAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-AU", {
	timeZone: "Asia/Manila",
	month: "short",
	day: "numeric",
});

function formatRevealRange(startIso: string, endIso: string): string {
	const start = new Date(startIso);
	// revealEnd is exclusive — subtract 1ms to display the inclusive last day
	const lastDay = new Date(new Date(endIso).getTime() - 1);
	return `${REVEAL_DATE_FORMATTER.format(start)} – ${REVEAL_DATE_FORMATTER.format(lastDay)}`;
}

function formatCountdown(msRemaining: number): string {
	if (msRemaining <= 0) return "any moment";
	const totalSeconds = Math.floor(msRemaining / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
	if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	if (minutes > 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
	return `${seconds}s`;
}

function useCountdown(targetIso: string | null) {
	const [msRemaining, setMsRemaining] = useState<number | null>(() => {
		if (!targetIso) return null;
		return new Date(targetIso).getTime() - Date.now();
	});
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!targetIso) {
			setMsRemaining(null);
			return;
		}
		const target = new Date(targetIso).getTime();
		// Skip invalidation on the first tick if we mount already past the boundary
		// — that state is authoritative from the server and doesn't need a refetch.
		let startedPast = target - Date.now() <= 0;
		let timeoutId: number | undefined;

		function tick() {
			const remaining = target - Date.now();
			setMsRemaining(remaining);
			if (remaining <= 0) {
				if (!startedPast) {
					queryClient.invalidateQueries({ queryKey: ["recognition-stats"] });
				}
				return;
			}
			startedPast = false;
			// Recompute delay every tick so the interval adapts as the boundary nears.
			const nextDelay = remaining > 60 * 60 * 1000 ? 60_000 : 1_000;
			timeoutId = window.setTimeout(tick, nextDelay);
		}

		// Re-tick immediately when the tab regains focus — browsers throttle
		// timers in background tabs, so the scheduled tick may land well after
		// the boundary otherwise.
		function handleVisibility() {
			if (document.visibilityState !== "visible") return;
			if (timeoutId !== undefined) {
				window.clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			tick();
		}

		tick();
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			if (timeoutId !== undefined) window.clearTimeout(timeoutId);
		};
	}, [targetIso, queryClient]);

	return msRemaining;
}

function StatItem({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ size?: number; className?: string }>;
	label: string;
	value: number;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
				<Icon size={18} className="text-primary" />
			</div>
			<div>
				<p className="text-2xl font-semibold text-foreground">{value}</p>
				<p className="text-xs text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}

function StatsWidgetSkeleton() {
	return (
		<div
			className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] animate-pulse space-y-6 h-full"
			aria-busy="true"
			aria-label="Loading recognition stats"
		>
			<div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded" />
			<div className="grid grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
						<div className="space-y-1">
							<div className="h-6 w-8 bg-gray-200 dark:bg-white/10 rounded" />
							<div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded" />
						</div>
					</div>
				))}
			</div>
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10" />
						<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

function LockedLeaderboard({
	visibility,
	msRemaining,
}: {
	visibility: LeaderboardVisibility;
	msRemaining: number | null;
}) {
	const hasRange = visibility.revealStart && visibility.revealEnd;
	const rangeLabel = hasRange
		? formatRevealRange(visibility.revealStart as string, visibility.revealEnd as string)
		: null;
	const showCountdown = msRemaining !== null && msRemaining > 0;

	return (
		<div className="flex flex-col min-h-0 flex-1">
			<div className="flex items-center gap-2 mb-3 shrink-0">
				<Lock size={16} className="text-muted-foreground" />
				<h4 className="text-sm font-medium text-foreground/70">Most Recognized</h4>
			</div>
			<div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-muted/30 px-6 py-8 text-center">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
					<Lock size={18} className="text-primary" />
				</div>
				{rangeLabel ? (
					<>
						<p className="text-sm font-medium text-foreground">Rankings revealed</p>
						<p className="text-sm text-muted-foreground mt-0.5">{rangeLabel}</p>
					</>
				) : (
					<p className="text-sm font-medium text-foreground">Rankings hidden</p>
				)}
				{showCountdown && (
					<p className="mt-3 text-sm font-semibold tabular-nums text-primary" aria-live="polite">
						in {formatCountdown(msRemaining)}
					</p>
				)}
				<div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
					<Heart size={12} className="text-primary" />
					<span>Keep recognizing</span>
				</div>
			</div>
		</div>
	);
}

export function StatsWidget() {
	const { data, isPending, isError } = useQuery<{
		success: boolean;
		data: StatsData;
	}>({
		queryKey: ["recognition-stats"],
		queryFn: async () => {
			const res = await fetch("/api/recognition/stats");
			if (!res.ok) throw new Error("Failed to fetch stats");
			return res.json();
		},
		staleTime: 30_000,
	});

	const visibility = data?.data?.leaderboardVisibility ?? null;
	// Always watch the next boundary: revealEnd if the leaderboard is currently
	// visible (so we hide it at month-end / range-end), otherwise revealStart.
	const nextBoundaryIso = visibility
		? visibility.visible
			? visibility.revealEnd
			: visibility.revealStart
		: null;
	const msRemaining = useCountdown(nextBoundaryIso);

	if (isPending) {
		return <StatsWidgetSkeleton />;
	}

	if (isError || !data?.data) {
		return (
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] h-full">
				<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight mb-2">
					Recognition Stats
				</h3>
				<p className="text-sm text-muted-foreground">
					Unable to load stats. Please try again later.
				</p>
			</div>
		);
	}

	const stats = data.data;
	const resolvedVisibility = stats.leaderboardVisibility;
	const showList = resolvedVisibility.visible && stats.topRecipients.length > 0;
	const showLocked = !resolvedVisibility.visible;
	const showEmpty = resolvedVisibility.visible && stats.topRecipients.length === 0;

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col gap-6 h-full">
			<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight shrink-0">
				Recognition Stats
			</h3>

			<div className="grid grid-cols-3 gap-4 shrink-0">
				<StatItem icon={Send} label="Cards Sent" value={stats?.sent ?? 0} />
				<StatItem icon={Inbox} label="Cards Received" value={stats?.received ?? 0} />
				<StatItem icon={Calendar} label="This Month" value={stats?.monthlyTotal ?? 0} />
			</div>

			{showList ? (
				<div className="flex flex-col min-h-0 flex-1">
					<div className="flex items-center gap-2 mb-3 shrink-0">
						<Trophy size={16} className="text-primary" />
						<h4 className="text-sm font-medium text-foreground/70">Most Recognized</h4>
					</div>
					<ol className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
						{stats.topRecipients.map((person, index) => {
							const isPodium = index < 3;
							const style = isPodium ? PODIUM_STYLES[index] : null;

							return (
								<li
									key={`${person.firstName}-${person.lastName}`}
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
											{index + 1}
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
			) : showLocked ? (
				<LockedLeaderboard visibility={resolvedVisibility} msRemaining={msRemaining} />
			) : showEmpty ? (
				<div className="flex flex-col min-h-0 flex-1">
					<div className="flex items-center gap-2 mb-3 shrink-0">
						<Trophy size={16} className="text-primary" />
						<h4 className="text-sm font-medium text-foreground/70">Most Recognized</h4>
					</div>
					<div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-muted/30 px-6 py-8 text-center">
						<p className="text-sm text-muted-foreground">
							No recognitions yet this month — be the first!
						</p>
					</div>
				</div>
			) : null}
		</div>
	);
}
