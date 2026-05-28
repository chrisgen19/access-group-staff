"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateLeaderboardVisibilitySettings } from "@/lib/actions/settings-actions";
import { clampDay, REVEAL_DAY_MAX, REVEAL_DAY_MIN } from "@/lib/leaderboard/visibility";

export interface LeaderboardVisibilityPanelProps {
	initialStartDay: number;
	initialEndDay: number;
}

export function LeaderboardVisibilityPanel({
	initialStartDay,
	initialEndDay,
}: LeaderboardVisibilityPanelProps) {
	const [startDay, setStartDay] = useState<number>(initialStartDay);
	const [endDay, setEndDay] = useState<number>(initialEndDay);
	const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();

	function save(nextStart: number, nextEnd: number) {
		startTransition(async () => {
			try {
				const result = await updateLeaderboardVisibilitySettings({
					revealStartDay: nextStart,
					revealEndDay: nextEnd,
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

	function handleStartBlur() {
		const clamped = clampDay(startDay);
		// Clamp endDay too — it may be NaN if the user cleared it without blurring,
		// which would otherwise send NaN to save() and trigger a generic error.
		const nextEnd = Math.max(clamped, clampDay(endDay));
		if (clamped !== startDay) setStartDay(clamped);
		if (nextEnd !== endDay) setEndDay(nextEnd);
		save(clamped, nextEnd);
	}

	function handleEndBlur() {
		const clamped = clampDay(endDay);
		if (clamped < startDay) {
			toast.error("Reveal end day must be on or after the start day");
			setEndDay(startDay);
			save(startDay, startDay);
			return;
		}
		if (clamped !== endDay) setEndDay(clamped);
		save(startDay, clamped);
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Leaderboard Visibility
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					The dashboard "Most Recognized" panel reveals the previous month's winners during this
					window each month. Outside it, the panel stays locked. Counting always covers the full
					calendar month (Asia/Manila). Days range from {REVEAL_DAY_MIN} to {REVEAL_DAY_MAX}.
				</p>
			</div>

			<div className="space-y-4 px-5 py-6 sm:px-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">Reveal from day</p>
						<p className="text-xs text-muted-foreground">
							First day of the month the previous month's winners appear.
						</p>
					</div>
					<Input
						type="number"
						min={REVEAL_DAY_MIN}
						max={REVEAL_DAY_MAX}
						value={Number.isFinite(startDay) ? startDay : ""}
						onChange={(e) => setStartDay(Number.parseInt(e.target.value, 10))}
						onBlur={handleStartBlur}
						disabled={isPending}
						className="w-full shrink-0 sm:w-24"
					/>
				</div>

				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">Reveal until day</p>
						<p className="text-xs text-muted-foreground">
							Last day (inclusive) the winners stay visible before locking again.
						</p>
					</div>
					<Input
						type="number"
						min={REVEAL_DAY_MIN}
						max={REVEAL_DAY_MAX}
						value={Number.isFinite(endDay) ? endDay : ""}
						onChange={(e) => setEndDay(Number.parseInt(e.target.value, 10))}
						onBlur={handleEndBlur}
						disabled={isPending}
						className="w-full shrink-0 sm:w-24"
					/>
				</div>
			</div>
		</div>
	);
}
