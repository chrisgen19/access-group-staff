"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StaffOption {
	id: string;
	firstName: string;
	lastName: string;
}

interface StaffComboboxProps {
	value: string;
	staff: StaffOption[];
	onChange: (id: string) => void;
	placeholder?: string;
	className?: string;
}

export function StaffCombobox({
	value,
	staff,
	onChange,
	placeholder = "All Staff",
	className,
}: StaffComboboxProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const selected = value ? (staff.find((s) => s.id === value) ?? null) : null;

	const filtered = query
		? staff.filter((s) =>
				`${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()),
			)
		: staff;

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
				setQuery("");
			}
		}
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				setOpen(false);
				setQuery("");
				inputRef.current?.blur();
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKey);
		};
	}, []);

	function handleSelect(user: StaffOption) {
		onChange(user.id);
		setOpen(false);
		setQuery("");
	}

	function handleClear() {
		onChange("");
		setQuery("");
		setOpen(false);
		inputRef.current?.focus();
	}

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			{selected ? (
				<div className="flex h-9 items-center justify-between rounded-full border border-input bg-transparent pl-3 pr-1 dark:bg-input/30">
					<span className="truncate text-sm text-foreground">
						{selected.firstName} {selected.lastName}
					</span>
					<button
						type="button"
						onClick={handleClear}
						aria-label="Clear staff filter"
						className="ml-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
					>
						<X size={14} />
					</button>
				</div>
			) : (
				<div className="relative h-9">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						ref={inputRef}
						type="text"
						value={query}
						placeholder={placeholder}
						onChange={(e) => {
							setQuery(e.target.value);
							setOpen(true);
						}}
						onFocus={() => setOpen(true)}
						className="h-9 w-full rounded-full border border-input bg-transparent pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					/>
					<ChevronDown
						size={14}
						className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
				</div>
			)}

			{open && !selected && (
				<div
					role="listbox"
					className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-card shadow-lg dark:border-white/10"
				>
					{filtered.length === 0 ? (
						<div className="px-3 py-2 text-sm text-muted-foreground">No staff found</div>
					) : (
						filtered.map((s) => (
							<button
								key={s.id}
								type="button"
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => handleSelect(s)}
								className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
							>
								{s.firstName} {s.lastName}
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
}
