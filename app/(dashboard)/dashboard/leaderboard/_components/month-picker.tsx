"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface MonthPickerItem {
	key: string;
	label: string;
}

interface MonthPickerProps {
	items: MonthPickerItem[];
	selected: string;
}

export function MonthPicker({ items, selected }: MonthPickerProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleChange(next: string | null) {
		if (!next || next === selected) return;
		startTransition(() => {
			const params = new URLSearchParams({ month: next });
			router.push(`/dashboard/leaderboard?${params.toString()}`);
		});
	}

	return (
		<Select value={selected} onValueChange={handleChange} disabled={isPending}>
			<SelectTrigger className="w-full rounded-full bg-card sm:w-64">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{items.map((item) => (
					<SelectItem key={item.key} value={item.key}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
