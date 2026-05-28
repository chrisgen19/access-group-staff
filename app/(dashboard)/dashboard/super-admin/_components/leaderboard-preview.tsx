"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function firstOfNextMonth(): string {
	// Derive "now" in Asia/Manila so the default lands on the right month even
	// near UTC boundaries, then return the 1st of the following month.
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Manila",
		year: "numeric",
		month: "numeric",
	}).formatToParts(new Date());
	const year = Number(parts.find((p) => p.type === "year")?.value);
	const month = Number(parts.find((p) => p.type === "month")?.value); // 1-12
	const nextYear = month === 12 ? year + 1 : year;
	const nextMonth = month === 12 ? 1 : month + 1;
	return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

export function LeaderboardPreviewPanel() {
	const [date, setDate] = useState<string>(firstOfNextMonth());

	function openPreview() {
		if (!date) return;
		window.open(`/dashboard?previewNow=${encodeURIComponent(date)}`, "_blank", "noopener");
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Leaderboard Preview
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Preview how the dashboard "Most Recognized" panel looks on a chosen date — useful for
					checking the reveal window before it opens. Pick a date inside the reveal window (e.g. the
					1st of next month) to see the previous month's winners. Only super admins can use this;
					the date is interpreted in Asia/Manila.
				</p>
			</div>

			<div className="px-5 py-6 sm:px-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div className="flex-1">
						<p className="text-sm font-medium text-foreground">Preview date</p>
						<p className="text-xs text-muted-foreground">
							Opens the dashboard in a new tab as if it were this date.
						</p>
					</div>

					<div className="flex w-full items-center gap-2 sm:w-auto">
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="w-full sm:w-44"
						/>
						<Button onClick={openPreview} disabled={!date} className="shrink-0 gap-1.5">
							<ExternalLink size={16} />
							Open preview
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
