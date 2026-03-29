"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_VALUES } from "@/lib/recognition";
import { cn } from "@/lib/utils";

interface RecognitionFilterBarProps {
	search: string;
	onSearchChange: (value: string) => void;
	selectedValues: string[];
	onSelectedValuesChange: (values: string[]) => void;
	dateFrom: string;
	onDateFromChange: (value: string) => void;
	dateTo: string;
	onDateToChange: (value: string) => void;
	onClear: () => void;
}

export function RecognitionFilterBar({
	search,
	onSearchChange,
	selectedValues,
	onSelectedValuesChange,
	dateFrom,
	onDateFromChange,
	dateTo,
	onDateToChange,
	onClear,
}: RecognitionFilterBarProps) {
	const hasActiveFilters =
		search.length > 0 ||
		selectedValues.length > 0 ||
		dateFrom.length > 0 ||
		dateTo.length > 0;

	function toggleValue(key: string) {
		if (selectedValues.includes(key)) {
			onSelectedValuesChange(selectedValues.filter((v) => v !== key));
		} else {
			onSelectedValuesChange([...selectedValues, key]);
		}
	}

	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card p-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
				{/* Search */}
				<div className="relative min-w-0 lg:w-64">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						placeholder="Search by name..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-9 w-full rounded-full border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					/>
				</div>

				{/* Value toggles */}
				<div className="flex flex-wrap items-center gap-1.5">
					{COMPANY_VALUES.map((value) => {
						const shortKey = value.key.replace("values", "");
						const urlKey =
							shortKey.charAt(0).toLowerCase() + shortKey.slice(1);
						const isActive = selectedValues.includes(urlKey);

						return (
							<button
								key={value.key}
								type="button"
								onClick={() => toggleValue(urlKey)}
								className={cn(
									"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
									isActive
										? "border-primary/20 bg-primary/5 text-primary dark:bg-primary/10"
										: "border-gray-200 dark:border-white/10 bg-transparent text-muted-foreground hover:border-gray-300 dark:hover:border-white/20",
								)}
							>
								{value.label}
							</button>
						);
					})}
				</div>

				{/* Date range */}
				<div className="flex items-center gap-2 lg:ml-auto">
					<label className="text-xs text-muted-foreground shrink-0">
						From
					</label>
					<input
						type="date"
						value={dateFrom}
						onChange={(e) => onDateFromChange(e.target.value)}
						className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					/>
					<label className="text-xs text-muted-foreground shrink-0">
						To
					</label>
					<input
						type="date"
						value={dateTo}
						onChange={(e) => onDateToChange(e.target.value)}
						className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					/>
				</div>

				{/* Clear */}
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClear}
						className="shrink-0 gap-1 text-muted-foreground"
					>
						<X size={14} />
						Clear
					</Button>
				)}
			</div>
		</div>
	);
}
