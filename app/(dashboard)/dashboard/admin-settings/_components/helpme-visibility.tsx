"use client";

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
			} catch {
				setEnabled(previous);
				toast.error("Failed to update Help Me visibility");
			}
		});
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Help Me Module
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Control whether staff can access the Help Me Tickets module. Admins always retain access
					so existing tickets stay reachable.
				</p>
			</div>

			<div className="px-8 py-6">
				<div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/10 p-5 gap-4">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">Show Help Me for staff</p>
						<p className="text-xs text-muted-foreground">
							When off, the sidebar entry, floating help button, and `/dashboard/helpme` pages are
							hidden from non-admin users.
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
