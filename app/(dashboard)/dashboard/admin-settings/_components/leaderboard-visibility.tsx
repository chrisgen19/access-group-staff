"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { updateLeaderboardVisibilitySettings } from "@/lib/actions/settings-actions";
import {
	type LeaderboardVisibilityMode,
	REVEAL_DAYS_MAX,
	REVEAL_DAYS_MIN,
} from "@/lib/leaderboard/visibility";

const MODE_LABELS: Record<LeaderboardVisibilityMode, string> = {
	always: "Always visible",
	last_n_days_of_month: "Last N days of month",
	custom_range: "Custom date range",
};

const MODE_DESCRIPTIONS: Record<LeaderboardVisibilityMode, string> = {
	always: "Show the leaderboard all month.",
	last_n_days_of_month: "Only reveal during the last N days of each month (Asia/Manila).",
	custom_range: "Only show between a specific start and end date.",
};

export interface LeaderboardVisibilityPanelProps {
	initialMode: LeaderboardVisibilityMode;
	initialDays: number;
	initialCustomStart: string | null;
	initialCustomEnd: string | null;
}

export function LeaderboardVisibilityPanel({
	initialMode,
	initialDays,
	initialCustomStart,
	initialCustomEnd,
}: LeaderboardVisibilityPanelProps) {
	const [mode, setMode] = useState<LeaderboardVisibilityMode>(initialMode);
	const [days, setDays] = useState<number>(initialDays);
	const [customStart, setCustomStart] = useState<string>(initialCustomStart ?? "");
	const [customEnd, setCustomEnd] = useState<string>(initialCustomEnd ?? "");
	const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();

	function save(next: {
		mode: LeaderboardVisibilityMode;
		days: number;
		customStart: string;
		customEnd: string;
	}) {
		startTransition(async () => {
			try {
				const result = await updateLeaderboardVisibilitySettings({
					mode: next.mode,
					revealDays: next.days,
					customStart: next.customStart || null,
					customEnd: next.customEnd || null,
				});

				if (!result.success) {
					toast.error(result.error ?? "Failed to update visibility settings");
					return;
				}

				toast.success("Leaderboard visibility updated");
				queryClient.invalidateQueries({ queryKey: ["recognition-stats"] });
			} catch {
				toast.error("Failed to update visibility settings");
			}
		});
	}

	function handleModeChange(newMode: LeaderboardVisibilityMode) {
		setMode(newMode);
		save({ mode: newMode, days, customStart, customEnd });
	}

	function handleDaysBlur() {
		const clamped = Math.min(
			Math.max(Number.isFinite(days) ? days : REVEAL_DAYS_MIN, REVEAL_DAYS_MIN),
			REVEAL_DAYS_MAX,
		);
		if (clamped !== days) setDays(clamped);
		save({ mode, days: clamped, customStart, customEnd });
	}

	function handleCustomStartBlur() {
		save({ mode, days, customStart, customEnd });
	}

	function handleCustomEndBlur() {
		if (customStart && customEnd && customStart > customEnd) {
			toast.error("Start date must be on or before end date");
			return;
		}
		save({ mode, days, customStart, customEnd });
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Leaderboard Visibility
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Control when the "Most Recognized" leaderboard is revealed on the dashboard. The
					leaderboard resets each calendar month. All dates and month boundaries are interpreted in
					Asia/Manila time.
				</p>
			</div>

			<div className="space-y-4 px-5 py-6 sm:px-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">Visibility mode</p>
						<p className="text-xs text-muted-foreground">{MODE_DESCRIPTIONS[mode]}</p>
					</div>
					<Select
						value={mode}
						onValueChange={(val) => handleModeChange(val as LeaderboardVisibilityMode)}
						disabled={isPending}
					>
						<SelectTrigger className="w-full shrink-0 rounded-full sm:w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="always">{MODE_LABELS.always}</SelectItem>
							<SelectItem value="last_n_days_of_month">
								{MODE_LABELS.last_n_days_of_month}
							</SelectItem>
							<SelectItem value="custom_range">{MODE_LABELS.custom_range}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{mode === "last_n_days_of_month" && (
					<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
						<div className="min-w-0">
							<p className="text-sm font-medium text-foreground">Reveal days</p>
							<p className="text-xs text-muted-foreground">
								How many days before month-end to reveal the leaderboard.
							</p>
						</div>
						<Input
							type="number"
							min={REVEAL_DAYS_MIN}
							max={REVEAL_DAYS_MAX}
							value={days}
							onChange={(e) => setDays(Number.parseInt(e.target.value, 10))}
							onBlur={handleDaysBlur}
							disabled={isPending}
							className="w-full shrink-0 sm:w-24"
						/>
					</div>
				)}

				{mode === "custom_range" && (
					<div className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:p-5">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<div>
								<Label
									htmlFor="leaderboard-custom-start"
									className="text-sm font-medium text-foreground"
								>
									Start date
								</Label>
								<p className="text-xs text-muted-foreground mt-0.5">Asia/Manila, inclusive.</p>
							</div>
							<Input
								id="leaderboard-custom-start"
								type="date"
								value={customStart}
								onChange={(e) => setCustomStart(e.target.value)}
								onBlur={handleCustomStartBlur}
								disabled={isPending}
								className="w-full shrink-0 sm:w-48"
							/>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<div>
								<Label
									htmlFor="leaderboard-custom-end"
									className="text-sm font-medium text-foreground"
								>
									End date
								</Label>
								<p className="text-xs text-muted-foreground mt-0.5">Asia/Manila, inclusive.</p>
							</div>
							<Input
								id="leaderboard-custom-end"
								type="date"
								value={customEnd}
								onChange={(e) => setCustomEnd(e.target.value)}
								onBlur={handleCustomEndBlur}
								disabled={isPending}
								className="w-full shrink-0 sm:w-48"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
