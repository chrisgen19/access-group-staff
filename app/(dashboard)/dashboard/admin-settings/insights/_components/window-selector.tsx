"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
	{ value: 30, label: "30 days" },
	{ value: 90, label: "90 days" },
] as const;

interface WindowSelectorProps {
	value: number;
}

export function WindowSelector({ value }: WindowSelectorProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const select = (next: number) => {
		const sp = new URLSearchParams(searchParams.toString());
		if (next === 30) sp.delete("window");
		else sp.set("window", String(next));
		const qs = sp.toString();
		startTransition(() => {
			router.push(qs ? `${pathname}?${qs}` : pathname);
		});
	};

	return (
		// Toggle-button pattern using `aria-pressed`, not radio. Real radios
		// require arrow-key roving-tabindex behavior; plain Buttons would lie.
		// `<fieldset>` is the semantic group container — biome rejects
		// `role="group"` / `aria-label` on a plain div, and `<fieldset>` lets
		// us label the group via a visually-hidden `<legend>`.
		<fieldset className="inline-flex items-center gap-1 rounded-lg border bg-card p-1">
			<legend className="sr-only">Time window</legend>
			{OPTIONS.map((opt) => {
				const active = opt.value === value;
				return (
					<Button
						key={opt.value}
						type="button"
						size="sm"
						variant={active ? "default" : "ghost"}
						aria-pressed={active}
						disabled={isPending}
						onClick={() => select(opt.value)}
						className={cn("h-8 px-3 text-xs", isPending && "opacity-70")}
					>
						{opt.label}
					</Button>
				);
			})}
		</fieldset>
	);
}
