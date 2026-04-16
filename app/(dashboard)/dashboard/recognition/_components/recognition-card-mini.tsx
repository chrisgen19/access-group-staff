"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	type RecognitionCard,
	COMPANY_VALUES,
	formatRecognitionDate,
} from "@/lib/recognition";
import {
	AccessGroupLogo,
	AccessBusinessLogo,
	BackgroundGraphic,
} from "@/components/shared/access-logos";
import { FitText } from "@/components/shared/fit-text";
import type { CardSize } from "@/stores/use-preferences-store";

const SIZE_CONFIG = {
	compact: {
		outer: "p-2 md:p-3 gap-2 md:gap-3",
		field: "p-1.5 md:p-2",
		labelText: "text-[7px] md:text-[8px]",
		valueText: "text-xs md:text-sm",
		messageMin: "min-h-[60px]",
		messageText: "text-[10px] md:text-xs",
		fromDateH: "min-h-10 md:min-h-12",
		logoH: "h-12 md:h-14",
		logoSize: "h-4 md:h-5 w-auto",
		businessLogoSize: "h-6 md:h-8 w-auto",
		valuesTitle: "text-[8px] md:text-[9px]",
		lgCheckbox: "w-4 h-4 md:w-5 md:h-5",
		lgCheckIcon: 8,
		lgLabel: "text-sm md:text-base",
		smCheckbox: "w-2 h-2 md:w-2.5 md:h-2.5",
		smCheckIcon: 6,
		smLabel: "text-[6px] md:text-[7px]",
		valuesPanel: "p-3 md:p-4",
	},
	normal: {
		outer: "p-3 md:p-5 gap-3 md:gap-4",
		field: "p-2 md:p-3",
		labelText: "text-[8px] md:text-[9px]",
		valueText: "text-sm md:text-base",
		messageMin: "min-h-[80px]",
		messageText: "text-xs md:text-sm",
		fromDateH: "min-h-12 md:min-h-14",
		logoH: "h-14 md:h-16",
		logoSize: "h-5 md:h-7 w-auto",
		businessLogoSize: "h-8 md:h-10 w-auto",
		valuesTitle: "text-[9px] md:text-[11px]",
		lgCheckbox: "w-5 h-5 md:w-6 md:h-6",
		lgCheckIcon: 10,
		lgLabel: "text-base md:text-lg",
		smCheckbox: "w-2.5 h-2.5 md:w-3 md:h-3",
		smCheckIcon: 7,
		smLabel: "text-[7px] md:text-[8px]",
		valuesPanel: "p-4 md:p-5",
	},
	expanded: {
		outer: "p-4 md:p-6 gap-4 md:gap-5",
		field: "p-2.5 md:p-3",
		labelText: "text-[9px] md:text-[10px]",
		valueText: "text-base md:text-lg",
		messageMin: "min-h-[120px]",
		messageText: "text-sm md:text-base",
		fromDateH: "min-h-14 md:min-h-16",
		logoH: "h-16 md:h-20",
		logoSize: "h-7 md:h-9 w-auto",
		businessLogoSize: "h-12 md:h-16 w-auto",
		valuesTitle: "text-[10px] md:text-[12px]",
		lgCheckbox: "w-6 h-6 md:w-7 md:h-7",
		lgCheckIcon: 14,
		lgLabel: "text-lg md:text-xl",
		smCheckbox: "w-3 h-3 md:w-3.5 md:h-3.5",
		smCheckIcon: 8,
		smLabel: "text-[8px] md:text-[9px]",
		valuesPanel: "p-5 md:p-6",
	},
};

function ValueIndicator({
	checked,
	checkboxClass,
	iconSize,
	label,
}: {
	checked: boolean;
	checkboxClass: string;
	iconSize: number;
	label: string;
}) {
	return (
		<div
			role="img"
			aria-label={`${label}: ${checked ? "demonstrated" : "not demonstrated"}`}
			className={cn(
				"flex-shrink-0 flex items-center justify-center",
				checkboxClass,
				checked ? "bg-[#333]" : "bg-[#e5e7eb]",
			)}
		>
			{checked && (
				<Check size={iconSize} strokeWidth={3} className="text-white" />
			)}
		</div>
	);
}

export function RecognitionCardMini({
	card,
	size = "normal",
	isNew = false,
}: {
	card: RecognitionCard;
	size?: CardSize;
	isNew?: boolean;
}) {
	const s = SIZE_CONFIG[size];

	return (
		<div
			className={cn(
				"bg-[#e6e7e8] relative shadow-md flex flex-col md:flex-row",
				s.outer,
				isNew && "ring-2 ring-primary/30",
			)}
		>
			{/* New Badge */}
			{isNew && (
				<div className="absolute top-2 left-2 z-10">
					<span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wider shadow-sm">
						New
					</span>
				</div>
			)}

			{/* Crop Marks */}
			<div
				className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-gray-400"
				aria-hidden="true"
			/>
			<div
				className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-gray-400"
				aria-hidden="true"
			/>
			<div
				className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-gray-400"
				aria-hidden="true"
			/>
			<div
				className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-gray-400"
				aria-hidden="true"
			/>

			{/* Left Column */}
			<div className="flex-1 flex flex-col gap-2">
				{/* TO */}
				<div className={cn("bg-white rounded-sm flex flex-col shadow-sm", s.field)}>
					<span className={cn("font-black text-black mb-0.5", s.labelText)}>
						TO
					</span>
					<FitText className={cn("text-[#222]", s.valueText)}>
						{`${card.recipient.firstName} ${card.recipient.lastName}`}
					</FitText>
				</div>

				{/* WHAT YOU DID */}
				<div
					className={cn(
						"bg-white rounded-sm flex flex-col shadow-sm flex-grow relative",
						s.field,
						s.messageMin,
					)}
				>
					<span className={cn("font-black text-black mb-0.5", s.labelText)}>
						WHAT YOU DID
					</span>
					<p className={cn("text-[#222] leading-relaxed mb-8", s.messageText)}>
						{card.message}
					</p>

					{/* Small Value Checkboxes */}
					<div className="absolute bottom-2 left-2 right-2">
						<div className="flex justify-between items-center w-full gap-0.5">
							{COMPANY_VALUES.map((v) => {
								const checked =
									card[v.key as keyof RecognitionCard] === true;
								return (
									<div key={v.key} className="flex items-center gap-0.5">
										<ValueIndicator
											checked={checked}
											checkboxClass={s.smCheckbox}
											iconSize={s.smCheckIcon}
											label={v.label}
										/>
										<span
											className={cn(
												"font-black text-[#222] uppercase",
												s.smLabel,
												v.wrap && "leading-[1.1]",
											)}
										>
											{v.wrap ? (
												<>
													{v.label.split(" ").slice(0, -1).join(" ")}
													<br />
													{v.label.split(" ").at(-1)}
												</>
											) : (
												v.label
											)}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* FROM + DATE */}
				<div className="flex gap-2">
					<div
						className={cn(
							"bg-white rounded-sm flex flex-col flex-1 shadow-sm",
							s.field,
							s.fromDateH,
						)}
					>
						<span className={cn("font-black text-black mb-0.5", s.labelText)}>
							FROM
						</span>
						<FitText className={cn("text-[#222]", s.valueText)}>
							{`${card.sender.firstName} ${card.sender.lastName}`}
						</FitText>
					</div>
					<div
						className={cn(
							"bg-white rounded-sm flex flex-col flex-1 shadow-sm",
							s.field,
							s.fromDateH,
						)}
					>
						<span className={cn("font-black text-black mb-0.5", s.labelText)}>
							DATE
						</span>
						<span className={cn("text-[#222]", s.valueText)}>
							{formatRecognitionDate(card.date)}
						</span>
					</div>
				</div>
			</div>

			{/* Right Column */}
			<div className="flex-1 flex flex-col gap-2">
				{/* Logos */}
				<div className={cn("flex items-center justify-between px-1", s.logoH)}>
					<AccessGroupLogo color="#e31837" className={s.logoSize} />
					<AccessBusinessLogo color="#e31837" className={s.businessLogoSize} />
				</div>

				{/* Large Value Checkboxes */}
				<div
					className={cn(
						"bg-white rounded-sm flex flex-col flex-grow shadow-sm relative overflow-hidden",
						s.valuesPanel,
					)}
				>
					<div
						className="absolute left-[20%] top-[10%] w-[80%] h-[90%] pointer-events-none text-black opacity-[0.05]"
						aria-hidden="true"
					>
						<BackgroundGraphic
							preserveAspectRatio="xMinYMin meet"
							className="w-full h-full scale-[1.7] md:scale-[2] origin-top-left"
						/>
					</div>

					<h2 className={cn("text-[#e31837] font-bold mb-3 relative z-10", s.valuesTitle)}>
						WHICH ACCESS VALUES WERE DEMONSTRATED?
					</h2>

					<div className="flex flex-col gap-2 relative z-10">
						{COMPANY_VALUES.map((v) => {
							const checked =
								card[v.key as keyof RecognitionCard] === true;
							return (
								<div key={v.key} className="flex items-center gap-1.5">
									<ValueIndicator
										checked={checked}
										checkboxClass={s.lgCheckbox}
										iconSize={s.lgCheckIcon}
										label={v.label}
									/>
									<span
										className={cn(
											"font-black text-[#222] uppercase tracking-tight",
											s.lgLabel,
										)}
									>
										{v.label}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
