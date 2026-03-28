"use client";

import { Check } from "lucide-react";
import {
	AccessGroupLogo,
	AccessBusinessLogo,
	BackgroundGraphic,
} from "@/components/shared/access-logos";
import type { CardSize } from "@/stores/use-preferences-store";

interface RecognitionUser {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	position: string | null;
}

interface RecognitionCardData {
	id: string;
	message: string;
	date: string;
	sender: RecognitionUser;
	recipient: RecognitionUser;
	valuesPeople: boolean;
	valuesSafety: boolean;
	valuesRespect: boolean;
	valuesCommunication: boolean;
	valuesContinuousImprovement: boolean;
}

const COMPANY_VALUES = [
	{ key: "valuesPeople" as const, label: "People", wrap: false },
	{ key: "valuesSafety" as const, label: "Safety", wrap: false },
	{ key: "valuesRespect" as const, label: "Respect", wrap: false },
	{ key: "valuesCommunication" as const, label: "Communication", wrap: false },
	{
		key: "valuesContinuousImprovement" as const,
		label: "Continuous Improvement",
		wrap: true,
	},
];

function formatDate(dateString: string) {
	const [year, month, day] = dateString.split("T")[0].split("-");
	return new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
	).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

const SIZE_CONFIG = {
	compact: {
		outer: "p-2 gap-2",
		field: "p-1.5",
		labelText: "text-[6px]",
		valueText: "text-[10px]",
		messageMin: "min-h-[40px]",
		messageText: "text-[9px]",
		fromDateH: "h-8",
		logoH: "h-8",
		logoSize: "h-3 w-auto",
		valuesTitle: "text-[6px]",
		lgCheckbox: "w-3 h-3",
		lgCheckIcon: 6,
		lgLabel: "text-[9px]",
		smCheckbox: "w-1.5 h-1.5",
		smCheckIcon: 4,
		smLabel: "text-[5px]",
		valuesPanel: "p-2",
	},
	normal: {
		outer: "p-2.5 md:p-3 gap-2 md:gap-2.5",
		field: "p-1.5 md:p-2",
		labelText: "text-[7px] md:text-[8px]",
		valueText: "text-xs md:text-sm",
		messageMin: "min-h-[50px]",
		messageText: "text-[10px] md:text-xs",
		fromDateH: "h-9 md:h-10",
		logoH: "h-9 md:h-10",
		logoSize: "h-4 md:h-5 w-auto",
		valuesTitle: "text-[7px] md:text-[9px]",
		lgCheckbox: "w-3.5 h-3.5 md:w-4 md:h-4",
		lgCheckIcon: 8,
		lgLabel: "text-xs md:text-sm",
		smCheckbox: "w-2 h-2 md:w-2.5 md:h-2.5",
		smCheckIcon: 5,
		smLabel: "text-[6px] md:text-[7px]",
		valuesPanel: "p-2.5 md:p-3",
	},
	expanded: {
		outer: "p-3 md:p-5 gap-3 md:gap-4",
		field: "p-2 md:p-3",
		labelText: "text-[8px] md:text-[9px]",
		valueText: "text-sm md:text-base",
		messageMin: "min-h-[80px]",
		messageText: "text-xs md:text-sm",
		fromDateH: "h-11 md:h-14",
		logoH: "h-12 md:h-16",
		logoSize: "h-5 md:h-7 w-auto",
		valuesTitle: "text-[9px] md:text-[11px]",
		lgCheckbox: "w-5 h-5 md:w-6 md:h-6",
		lgCheckIcon: 10,
		lgLabel: "text-base md:text-lg",
		smCheckbox: "w-2.5 h-2.5 md:w-3 md:h-3",
		smCheckIcon: 7,
		smLabel: "text-[7px] md:text-[8px]",
		valuesPanel: "p-4 md:p-5",
	},
};

export function RecognitionCardMini({
	card,
	size = "normal",
}: {
	card: RecognitionCardData;
	size?: CardSize;
}) {
	const s = SIZE_CONFIG[size];

	return (
		<div
			className={`bg-[#e6e7e8] ${s.outer} relative shadow-md flex flex-col md:flex-row`}
		>
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
				<div
					className={`bg-white ${s.field} rounded-sm flex flex-col shadow-sm`}
				>
					<span
						className={`${s.labelText} font-black text-black mb-0.5`}
					>
						TO
					</span>
					<span className={`${s.valueText} text-[#222]`}>
						{card.recipient.firstName} {card.recipient.lastName}
					</span>
				</div>

				{/* WHAT YOU DID */}
				<div
					className={`bg-white ${s.field} rounded-sm flex flex-col shadow-sm ${s.messageMin} flex-grow relative`}
				>
					<span
						className={`${s.labelText} font-black text-black mb-0.5`}
					>
						WHAT YOU DID
					</span>
					<p
						className={`${s.messageText} text-[#222] leading-relaxed mb-8`}
					>
						{card.message}
					</p>

					{/* Small Value Checkboxes */}
					<div className="absolute bottom-2 left-2 right-2">
						<div className="flex justify-between items-center w-full gap-0.5">
							{COMPANY_VALUES.map((v) => {
								const checked =
									card[
										v.key as keyof RecognitionCardData
									] === true;
								return (
									<div
										key={v.key}
										className="flex items-center gap-0.5"
									>
										<div
											className={`${s.smCheckbox} flex-shrink-0 flex items-center justify-center ${
												checked
													? "bg-[#333]"
													: "bg-[#e5e7eb]"
											}`}
										>
											{checked && (
												<Check
													size={s.smCheckIcon}
													strokeWidth={3}
													className="text-white"
												/>
											)}
										</div>
										<span
											className={`${s.smLabel} font-black text-[#222] uppercase ${
												v.wrap
													? "leading-[1.1]"
													: ""
											}`}
										>
											{v.wrap ? (
												<>
													{v.label
														.split(" ")
														.slice(0, -1)
														.join(" ")}
													<br />
													{v.label
														.split(" ")
														.at(-1)}
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
						className={`bg-white ${s.field} rounded-sm flex flex-col flex-1 ${s.fromDateH} shadow-sm`}
					>
						<span
							className={`${s.labelText} font-black text-black mb-0.5`}
						>
							FROM
						</span>
						<span className={`${s.valueText} text-[#222]`}>
							{card.sender.firstName} {card.sender.lastName}
						</span>
					</div>
					<div
						className={`bg-white ${s.field} rounded-sm flex flex-col flex-1 ${s.fromDateH} shadow-sm`}
					>
						<span
							className={`${s.labelText} font-black text-black mb-0.5`}
						>
							DATE
						</span>
						<span className={`${s.valueText} text-[#222]`}>
							{formatDate(card.date)}
						</span>
					</div>
				</div>
			</div>

			{/* Right Column */}
			<div className="flex-1 flex flex-col gap-2">
				{/* Logos */}
				<div
					className={`${s.logoH} flex items-center justify-between px-1`}
				>
					<AccessGroupLogo
						color="#e31837"
						className={s.logoSize}
					/>
					<AccessBusinessLogo color="#e31837" />
				</div>

				{/* Large Value Checkboxes */}
				<div
					className={`bg-white ${s.valuesPanel} rounded-sm flex flex-col flex-grow shadow-sm relative overflow-hidden`}
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

					<h2
						className={`text-[#e31837] ${s.valuesTitle} font-bold mb-3 relative z-10`}
					>
						WHICH ACCESS VALUES WERE DEMONSTRATED?
					</h2>

					<div className="flex flex-col gap-2 relative z-10">
						{COMPANY_VALUES.map((v) => {
							const checked =
								card[v.key as keyof RecognitionCardData] ===
								true;
							return (
								<div
									key={v.key}
									className="flex items-center gap-1.5"
								>
									<div
										className={`${s.lgCheckbox} flex-shrink-0 flex items-center justify-center ${
											checked
												? "bg-[#333]"
												: "bg-[#e5e7eb]"
										}`}
									>
										{checked && (
											<Check
												size={s.lgCheckIcon}
												strokeWidth={3}
												className="text-white"
											/>
										)}
									</div>
									<span
										className={`font-black text-[#222] uppercase ${s.lgLabel} tracking-tight`}
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
