"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";
import { usePreferencesStore, BG_OPTIONS } from "@/stores/use-preferences-store";
import type { BgOptionId } from "@/stores/use-preferences-store";
import { cn } from "@/lib/utils";

export default function PreferencesPage() {
	const bgColorId = usePreferencesStore((s) => s.bgColorId);
	const setBgColor = usePreferencesStore((s) => s.setBgColor);

	function handleSelect(id: BgOptionId) {
		setBgColor(id);
		toast.success("Background color updated");
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Preferences
				</h3>
			</div>

			<div className="px-8 py-6 space-y-8">
				<div className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-foreground">
							Background Color
						</h4>
						<p className="mt-1 text-sm text-muted-foreground">
							Choose the page background color for your dashboard.
						</p>
					</div>

					<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
						{BG_OPTIONS.map((option) => {
							const isSelected = bgColorId === option.id;
							return (
								<button
									key={option.id}
									type="button"
									onClick={() => handleSelect(option.id)}
									className={cn(
										"group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all duration-200",
										isSelected
											? "border-primary ring-2 ring-primary/20"
											: "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20",
									)}
								>
									<div
										className="relative h-10 w-full rounded-xl border border-gray-200/60 dark:border-white/10"
										style={{ backgroundColor: option.value }}
									>
										{isSelected && (
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
													<Check size={12} className="text-primary-foreground" />
												</div>
											</div>
										)}
									</div>
									<span className={cn(
										"text-xs font-medium",
										isSelected ? "text-primary" : "text-muted-foreground",
									)}>
										{option.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
