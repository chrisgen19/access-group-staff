"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateHelpMeEnabled } from "@/lib/actions/settings-actions";

export interface HelpMeVisibilityPanelProps {
	initialEnabled: boolean;
}

export function HelpMeVisibilityPanel({ initialEnabled }: HelpMeVisibilityPanelProps) {
	const [enabled, setEnabled] = useState(initialEnabled);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	function handleChange(next: boolean) {
		const previous = enabled;
		setEnabled(next);

		startTransition(async () => {
			try {
				const result = await updateHelpMeEnabled(next);
				if (!result.success) {
					setEnabled(previous);
					toast.error(result.error ?? "Failed to update Help Me visibility");
					return;
				}
				toast.success(next ? "Help Me module enabled" : "Help Me module hidden");
				// Re-render the dashboard layout so the sidebar link and FAB reflect the new state
				// without requiring a hard reload.
				router.refresh();
			} catch {
				setEnabled(previous);
				toast.error("Failed to update Help Me visibility");
			}
		});
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Help Me Module
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Control whether the Help Me Tickets module is available across the app.
				</p>
			</div>

			<div className="px-5 py-6 sm:px-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">Enable Help Me</p>
						<p className="text-xs text-muted-foreground">
							When off, the sidebar entry, floating help button, and `/dashboard/helpme` pages are
							hidden for everyone. Existing tickets stay in the database and become reachable again
							when you turn this back on.
						</p>
					</div>
					<Switch
						checked={enabled}
						onCheckedChange={handleChange}
						disabled={isPending}
						aria-label="Toggle Help Me module"
					/>
				</div>
			</div>
		</div>
	);
}
