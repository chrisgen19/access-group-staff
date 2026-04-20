"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ActivityAction } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StaffCombobox } from "./staff-combobox";

const ACTION_LABELS: Record<ActivityAction, string> = {
	USER_SIGNED_IN: "Signed in",
	USER_SIGNED_OUT: "Signed out",
	SIGN_IN_FAILED: "Sign-in failed",
	OAUTH_ACCOUNT_LINKED: "OAuth linked",
	PASSWORD_CHANGED: "Password changed",
	PASSWORD_RESET: "Password reset",
};

interface ActivityLogFiltersProps {
	users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
	actions: ActivityAction[];
	initial: {
		actor: string;
		action: string;
		from: string;
		to: string;
		target: string;
	};
}

export function ActivityLogFilters({ users, actions, initial }: ActivityLogFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();
	const [target, setTarget] = useState(initial.target);
	const skipInitialDebounce = useRef(true);

	const updateParam = useCallback(
		(key: string, value: string) => {
			const sp = new URLSearchParams(searchParams.toString());
			if (value) {
				sp.set(key, value);
			} else {
				sp.delete(key);
			}
			sp.delete("page");
			const qs = sp.toString();
			startTransition(() => {
				router.push(qs ? `?${qs}` : "?");
			});
		},
		[router, searchParams],
	);

	useEffect(() => {
		if (skipInitialDebounce.current) {
			skipInitialDebounce.current = false;
			return;
		}
		const timer = setTimeout(() => {
			updateParam("target", target);
		}, 300);
		return () => clearTimeout(timer);
	}, [target, updateParam]);

	const hasActiveFilters =
		!!initial.actor || !!initial.action || !!initial.from || !!initial.to || !!initial.target;

	function clearAll() {
		setTarget("");
		skipInitialDebounce.current = true;
		startTransition(() => {
			router.push("?");
		});
	}

	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card p-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
			<div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
				<div className="relative min-w-0 lg:w-56">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						placeholder="Search target..."
						value={target}
						onChange={(e) => setTarget(e.target.value)}
						className="h-9 w-full rounded-full border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<StaffCombobox
						value={initial.actor}
						staff={users}
						onChange={(id) => updateParam("actor", id)}
						placeholder="All Staff"
						className="w-full sm:w-56"
					/>
					<select
						value={initial.action}
						onChange={(e) => updateParam("action", e.target.value)}
						className={cn(
							"h-9 rounded-lg border border-input bg-transparent px-2.5 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
							!initial.action && "text-muted-foreground",
						)}
					>
						<option value="">All actions</option>
						{actions.map((a) => (
							<option key={a} value={a}>
								{ACTION_LABELS[a]}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-2">
					<input
						type="date"
						value={initial.from}
						onChange={(e) => updateParam("from", e.target.value)}
						className={cn(
							"h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
							!initial.from && "text-muted-foreground",
						)}
					/>
					<span className="text-xs text-muted-foreground">to</span>
					<input
						type="date"
						value={initial.to}
						onChange={(e) => updateParam("to", e.target.value)}
						className={cn(
							"h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
							!initial.to && "text-muted-foreground",
						)}
					/>
				</div>

				<div className="flex items-center gap-1 shrink-0 lg:ml-auto">
					<Button
						variant="ghost"
						size="sm"
						onClick={clearAll}
						className={cn("gap-1 text-muted-foreground", !hasActiveFilters && "invisible")}
					>
						<X size={14} />
						Clear
					</Button>
				</div>
			</div>
		</div>
	);
}
