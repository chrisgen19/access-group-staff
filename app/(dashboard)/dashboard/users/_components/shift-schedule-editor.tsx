"use client";

import {
	DISPLAY_DAY_ORDER,
	SHIFT_DAY_LABELS,
	type ShiftScheduleFieldErrors,
	type ShiftScheduleInput,
	TIMEZONE_OPTIONS,
} from "@/lib/validations/user";

const timeInputClass =
	"w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed";

const breakInputClass =
	"w-16 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed";

const timezoneSelectClass =
	"rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

interface ShiftScheduleEditorProps {
	value: ShiftScheduleInput;
	onChange: (next: ShiftScheduleInput) => void;
	errors?: ShiftScheduleFieldErrors;
}

function hhmmToMinutes(value: string): number {
	const [h, m] = value.split(":").map((n) => Number.parseInt(n, 10));
	return h * 60 + m;
}

function formatHours(minutes: number): string {
	const hours = minutes / 60;
	return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}

export function ShiftScheduleEditor({ value, onChange, errors }: ShiftScheduleEditorProps) {
	function updateDay(dayOfWeek: number, patch: Partial<ShiftScheduleInput["days"][number]>) {
		onChange({
			...value,
			days: value.days.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
		});
	}

	function applyPreset(preset: "weekdays-9-5" | "weekdays-8-4" | "everyday-9-5" | "clear") {
		const makeDay = (
			dayOfWeek: number,
			isWorking: boolean,
			startTime: string | null,
			endTime: string | null,
			breakMins: number,
		) => ({ dayOfWeek, isWorking, startTime, endTime, breakMins });

		const patterns: Record<typeof preset, (d: number) => ReturnType<typeof makeDay>> = {
			"weekdays-9-5": (d) =>
				d >= 1 && d <= 5
					? makeDay(d, true, "09:00", "17:00", 60)
					: makeDay(d, false, null, null, 0),
			"weekdays-8-4": (d) =>
				d >= 1 && d <= 5
					? makeDay(d, true, "08:00", "16:00", 60)
					: makeDay(d, false, null, null, 0),
			"everyday-9-5": (d) => makeDay(d, true, "09:00", "17:00", 60),
			clear: (d) => makeDay(d, false, null, null, 0),
		};

		const build = patterns[preset];
		onChange({ ...value, days: [0, 1, 2, 3, 4, 5, 6].map(build) });
	}

	const totalMins = value.days.reduce((sum, day) => {
		if (!day.isWorking || !day.startTime || !day.endTime) return sum;
		return sum + (hhmmToMinutes(day.endTime) - hhmmToMinutes(day.startTime)) - day.breakMins;
	}, 0);
	const workingDays = value.days.filter((d) => d.isWorking).length;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 px-4 py-3">
				<div className="flex flex-wrap items-center gap-3 text-sm">
					<div>
						<span className="font-semibold text-foreground">{formatHours(totalMins)}</span>
						<span className="text-muted-foreground"> / week · </span>
						<span className="text-muted-foreground">
							{workingDays} working {workingDays === 1 ? "day" : "days"}
						</span>
					</div>
					<label className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span>Timezone</span>
						<select
							aria-label="Shift schedule timezone"
							value={value.timezone}
							onChange={(e) => onChange({ ...value, timezone: e.target.value })}
							className={timezoneSelectClass}
						>
							{TIMEZONE_OPTIONS.includes(
								value.timezone as (typeof TIMEZONE_OPTIONS)[number],
							) ? null : (
								<option value={value.timezone}>{value.timezone}</option>
							)}
							{TIMEZONE_OPTIONS.map((tz) => (
								<option key={tz} value={tz}>
									{tz}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<PresetButton onClick={() => applyPreset("weekdays-9-5")}>Mon–Fri 9–5</PresetButton>
					<PresetButton onClick={() => applyPreset("weekdays-8-4")}>Mon–Fri 8–4</PresetButton>
					<PresetButton onClick={() => applyPreset("everyday-9-5")}>Every day 9–5</PresetButton>
					<PresetButton onClick={() => applyPreset("clear")} variant="ghost">
						Clear all
					</PresetButton>
				</div>
			</div>

			<div className="space-y-1.5">
				{DISPLAY_DAY_ORDER.map((dayOfWeek) => {
					const dayIndex = value.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
					const day = value.days[dayIndex];
					if (!day) return null;
					const dayError = errors?.days?.[dayIndex];
					const dayMins =
						day.isWorking && day.startTime && day.endTime
							? hhmmToMinutes(day.endTime) - hhmmToMinutes(day.startTime) - day.breakMins
							: 0;
					return (
						<div
							key={dayOfWeek}
							className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
								day.isWorking
									? "border-primary/20 bg-primary/[0.03]"
									: "border-gray-200/60 dark:border-white/10 bg-card"
							}`}
						>
							<label className="flex items-center gap-3 min-w-[8rem] flex-1 cursor-pointer">
								<input
									type="checkbox"
									checked={day.isWorking}
									onChange={(e) =>
										updateDay(dayOfWeek, {
											isWorking: e.target.checked,
											startTime: e.target.checked ? (day.startTime ?? "09:00") : null,
											endTime: e.target.checked ? (day.endTime ?? "17:00") : null,
											breakMins: e.target.checked ? day.breakMins : 0,
										})
									}
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
								/>
								<span
									className={`text-sm font-medium ${
										day.isWorking ? "text-foreground" : "text-muted-foreground"
									}`}
								>
									{SHIFT_DAY_LABELS[dayOfWeek]}
								</span>
							</label>

							{day.isWorking ? (
								<div className="flex items-center gap-2 flex-wrap">
									<div className="flex items-center gap-1.5">
										<input
											type="time"
											aria-label={`${SHIFT_DAY_LABELS[dayOfWeek]} start time`}
											value={day.startTime ?? ""}
											onChange={(e) => updateDay(dayOfWeek, { startTime: e.target.value || null })}
											className={timeInputClass}
										/>
										<span className="text-xs text-muted-foreground">to</span>
										<input
											type="time"
											aria-label={`${SHIFT_DAY_LABELS[dayOfWeek]} end time`}
											value={day.endTime ?? ""}
											onChange={(e) => updateDay(dayOfWeek, { endTime: e.target.value || null })}
											className={timeInputClass}
										/>
									</div>
									<div className="flex items-center gap-1.5">
										<input
											type="number"
											min={0}
											max={720}
											aria-label={`${SHIFT_DAY_LABELS[dayOfWeek]} break minutes`}
											value={day.breakMins}
											onChange={(e) =>
												updateDay(dayOfWeek, {
													breakMins: Number.parseInt(e.target.value, 10) || 0,
												})
											}
											className={breakInputClass}
										/>
										<span className="text-xs text-muted-foreground">min break</span>
									</div>
									{dayMins > 0 && (
										<span className="text-xs font-medium text-primary ml-auto">
											{formatHours(dayMins)}
										</span>
									)}
								</div>
							) : (
								<span className="text-sm text-muted-foreground italic ml-auto">Off</span>
							)}

							{(dayError?.startTime?.message ||
								dayError?.endTime?.message ||
								dayError?.breakMins?.message) && (
								<p className="w-full text-xs text-destructive pl-7">
									{dayError?.breakMins?.message ??
										dayError?.endTime?.message ??
										dayError?.startTime?.message}
								</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function PresetButton({
	children,
	onClick,
	variant = "default",
}: {
	children: React.ReactNode;
	onClick: () => void;
	variant?: "default" | "ghost";
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={
				variant === "ghost"
					? "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
					: "inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
			}
		>
			{children}
		</button>
	);
}
