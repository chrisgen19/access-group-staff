"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateActivityLogRetentionDays } from "@/lib/actions/settings-actions";
import {
	ACTIVITY_LOG_RETENTION_MAX,
	ACTIVITY_LOG_RETENTION_MIN,
} from "@/lib/activity-log-retention";

export function ActivityLogRetentionPanel({ initialDays }: { initialDays: number }) {
	const [days, setDays] = useState<string>(String(initialDays));
	const [isPending, startTransition] = useTransition();

	function handleSave() {
		const parsed = Number.parseInt(days, 10);
		if (
			!Number.isInteger(parsed) ||
			parsed < ACTIVITY_LOG_RETENTION_MIN ||
			parsed > ACTIVITY_LOG_RETENTION_MAX
		) {
			toast.error(
				`Retention must be between ${ACTIVITY_LOG_RETENTION_MIN} and ${ACTIVITY_LOG_RETENTION_MAX} days`,
			);
			return;
		}

		startTransition(async () => {
			const result = await updateActivityLogRetentionDays(parsed);
			if (!result.success) {
				toast.error(result.error ?? "Failed to update retention");
				return;
			}
			toast.success(`Activity log retention set to ${parsed} days`);
		});
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Activity Log Retention
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					How many days to keep activity logs before they are pruned automatically.
				</p>
			</div>

			<div className="px-8 py-6">
				<div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-white/10 p-5">
					<div className="flex-1">
						<p className="text-sm font-medium text-foreground">Retention period (days)</p>
						<p className="text-xs text-muted-foreground">
							Between {ACTIVITY_LOG_RETENTION_MIN} and {ACTIVITY_LOG_RETENTION_MAX} days.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<Input
							type="number"
							min={ACTIVITY_LOG_RETENTION_MIN}
							max={ACTIVITY_LOG_RETENTION_MAX}
							value={days}
							onChange={(e) => setDays(e.target.value)}
							className="w-28"
							disabled={isPending}
						/>
						<Button onClick={handleSave} disabled={isPending}>
							{isPending ? "Saving…" : "Save"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
