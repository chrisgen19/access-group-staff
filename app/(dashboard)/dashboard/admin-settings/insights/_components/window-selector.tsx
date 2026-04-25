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
		<div
			className="inline-flex items-center gap-1 rounded-lg border bg-card p-1"
			role="radiogroup"
			aria-label="Time window"
		>
			{OPTIONS.map((opt) => {
				const active = opt.value === value;
				return (
					<Button
						key={opt.value}
						type="button"
						size="sm"
						variant={active ? "default" : "ghost"}
						role="radio"
						aria-checked={active}
						disabled={isPending}
						onClick={() => select(opt.value)}
						className={cn("h-8 px-3 text-xs", isPending && "opacity-70")}
					>
						{opt.label}
					</Button>
				);
			})}
		</div>
	);
}
