"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { updateTopRecognizedLimit } from "@/lib/actions/settings-actions";

const LIMIT_OPTIONS = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50];

export function RecognitionSettingsPanel({ initialLimit }: { initialLimit: number }) {
	const [limit, setLimit] = useState(initialLimit);
	const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();

	function handleChange(newValue: number) {
		const previous = limit;
		setLimit(newValue);

		startTransition(async () => {
			try {
				const result = await updateTopRecognizedLimit(newValue);
				if (!result.success) {
					setLimit(previous);
					toast.error(result.error ?? "Failed to update setting");
				} else {
					toast.success(`Most Recognized limit updated to ${newValue}`);
					queryClient.invalidateQueries({ queryKey: ["recognition-stats"] });
				}
			} catch {
				setLimit(previous);
				toast.error("Failed to update setting");
			}
		});
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Recognition Settings
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Configure how recognition stats are displayed on the dashboard.
				</p>
			</div>

			<div className="px-5 py-6 sm:px-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">Most Recognized Limit</p>
						<p className="text-xs text-muted-foreground">
							Number of top recipients shown in the dashboard stats widget.
						</p>
					</div>

					<Select
						value={limit}
						onValueChange={(val) => {
							if (val !== null) handleChange(val);
						}}
						disabled={isPending}
					>
						<SelectTrigger className="w-full rounded-full sm:w-20">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LIMIT_OPTIONS.map((opt) => (
								<SelectItem key={opt} value={opt}>
									{opt}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
