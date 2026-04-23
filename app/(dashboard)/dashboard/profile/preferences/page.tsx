"use client";

import { Check, CreditCard, List, Maximize2, Minimize2, Square } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BgOptionId, CardSize, CardView } from "@/stores/use-preferences-store";
import {
	BG_OPTIONS,
	CARD_SIZE_OPTIONS,
	CARD_VIEW_OPTIONS,
	usePreferencesStore,
} from "@/stores/use-preferences-store";

const VIEW_ICONS: Record<CardView, React.ComponentType<{ size?: number; className?: string }>> = {
	physical: CreditCard,
	simple: List,
};

const SIZE_ICONS: Record<CardSize, React.ComponentType<{ size?: number; className?: string }>> = {
	compact: Minimize2,
	normal: Square,
	expanded: Maximize2,
};

export default function PreferencesPage() {
	const [mounted, setMounted] = useState(false);
	const { resolvedTheme } = useTheme();
	const isDark = mounted && resolvedTheme === "dark";

	useEffect(() => {
		setMounted(true);
	}, []);
	const bgColorId = usePreferencesStore((s) => s.bgColorId);
	const setBgColor = usePreferencesStore((s) => s.setBgColor);
	const cardView = usePreferencesStore((s) => s.cardView);
	const setCardView = usePreferencesStore((s) => s.setCardView);
	const cardSize = usePreferencesStore((s) => s.cardSize);
	const setCardSize = usePreferencesStore((s) => s.setCardSize);

	function handleBgSelect(id: BgOptionId) {
		setBgColor(id);
		toast.success("Background color updated");
	}

	function handleViewSelect(view: CardView) {
		setCardView(view);
		toast.success("Card view updated");
	}

	function handleSizeSelect(size: CardSize) {
		setCardSize(size);
		toast.success("Card size updated");
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Preferences
				</h3>
			</div>

			<div className="space-y-8 px-5 py-6 sm:px-8">
				{/* Background Color */}
				<div className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-foreground">Background Color</h4>
						<p className="mt-1 text-sm text-muted-foreground">
							Choose the page background color for your dashboard.
						</p>
						{isDark && (
							<p className="mt-1.5 text-xs text-muted-foreground/70">
								Background color is only available in light mode.
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
						{BG_OPTIONS.map((option) => {
							const isSelected = bgColorId === option.id;
							return (
								<button
									key={option.id}
									type="button"
									disabled={isDark}
									onClick={() => handleBgSelect(option.id)}
									className={cn(
										"group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all duration-200",
										isDark && "opacity-40 cursor-not-allowed",
										isSelected && !isDark
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
									<span
										className={cn(
											"text-xs font-medium",
											isSelected ? "text-primary" : "text-muted-foreground",
										)}
									>
										{option.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Card View */}
				<div className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-foreground">Card View</h4>
						<p className="mt-1 text-sm text-muted-foreground">
							Choose how recognition cards appear in feeds.
						</p>
					</div>

					<div className="grid max-w-xs grid-cols-2 gap-3">
						{CARD_VIEW_OPTIONS.map((option) => {
							const isSelected = cardView === option.id;
							const Icon = VIEW_ICONS[option.id];
							return (
								<button
									key={option.id}
									type="button"
									onClick={() => handleViewSelect(option.id)}
									className={cn(
										"group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200",
										isSelected
											? "border-primary ring-2 ring-primary/20"
											: "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20",
									)}
								>
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-xl",
											isSelected
												? "bg-primary/10 text-primary"
												: "bg-gray-100 dark:bg-white/5 text-muted-foreground",
										)}
									>
										<Icon size={20} />
									</div>
									<span
										className={cn(
											"text-xs font-medium",
											isSelected ? "text-primary" : "text-muted-foreground",
										)}
									>
										{option.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Card Size */}
				<div className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-foreground">Card Size</h4>
						<p className="mt-1 text-sm text-muted-foreground">
							Adjust the size of recognition cards in feeds.
						</p>
					</div>

					<div className="grid max-w-sm grid-cols-2 gap-3 sm:grid-cols-3">
						{CARD_SIZE_OPTIONS.map((option) => {
							const isSelected = cardSize === option.id;
							const Icon = SIZE_ICONS[option.id];
							return (
								<button
									key={option.id}
									type="button"
									onClick={() => handleSizeSelect(option.id)}
									className={cn(
										"group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200",
										isSelected
											? "border-primary ring-2 ring-primary/20"
											: "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20",
									)}
								>
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-xl",
											isSelected
												? "bg-primary/10 text-primary"
												: "bg-gray-100 dark:bg-white/5 text-muted-foreground",
										)}
									>
										<Icon size={20} />
									</div>
									<span
										className={cn(
											"text-xs font-medium",
											isSelected ? "text-primary" : "text-muted-foreground",
										)}
									>
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
