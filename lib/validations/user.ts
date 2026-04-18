import { z } from "zod";

const HHMM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const SUPPORTED_TIMEZONES: ReadonlySet<string> = (() => {
	const supported =
		typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
	return new Set(supported.length > 0 ? supported : ["UTC"]);
})();

function isValidTimezone(tz: string): boolean {
	if (SUPPORTED_TIMEZONES.has(tz)) return true;
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

export const SHIFT_DAY_LABELS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

export const SHIFT_DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// Monday-first display order. DB still stores 0=Sun..6=Sat; this is display-only.
export const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const shiftDaySchema = z
	.object({
		dayOfWeek: z.number().int().min(0).max(6),
		isWorking: z.boolean(),
		startTime: z.string().regex(HHMM_PATTERN, "Use 24h HH:mm format").nullable().optional(),
		endTime: z.string().regex(HHMM_PATTERN, "Use 24h HH:mm format").nullable().optional(),
		breakMins: z.number().int().min(0).max(720).default(0),
	})
	.superRefine((day, ctx) => {
		if (!day.isWorking) return;
		if (!day.startTime) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["startTime"],
				message: "Start time required for working day",
			});
		}
		if (!day.endTime) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endTime"],
				message: "End time required for working day",
			});
		}
		if (day.startTime && day.endTime && day.startTime >= day.endTime) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endTime"],
				message: "End time must be after start time",
			});
			return;
		}
		if (day.startTime && day.endTime) {
			const [sh, sm] = day.startTime.split(":").map((n) => Number.parseInt(n, 10));
			const [eh, em] = day.endTime.split(":").map((n) => Number.parseInt(n, 10));
			const durationMins = eh * 60 + em - (sh * 60 + sm);
			if (day.breakMins >= durationMins) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["breakMins"],
					message: "Break must be shorter than the shift duration",
				});
			}
		}
	});

export const shiftScheduleSchema = z.object({
	timezone: z
		.string()
		.min(1)
		.default("Asia/Manila")
		.refine(isValidTimezone, { message: "Invalid IANA timezone" }),
	days: z
		.array(shiftDaySchema)
		.length(7, "Schedule must have one entry per weekday")
		.refine(
			(days) => {
				const seen = new Set(days.map((d) => d.dayOfWeek));
				return seen.size === 7 && [0, 1, 2, 3, 4, 5, 6].every((d) => seen.has(d));
			},
			{ message: "Schedule must cover days 0-6 exactly once" },
		),
});

export interface ShiftDayFieldErrors {
	startTime?: { message?: string };
	endTime?: { message?: string };
	breakMins?: { message?: string };
}

export interface ShiftScheduleFieldErrors {
	timezone?: { message?: string };
	days?: ShiftDayFieldErrors[];
}

export const createUserSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	displayName: z.string().optional(),
	phone: z.string().optional(),
	position: z.string().optional(),
	branch: z.enum(["ISO", "PERTH"]).nullable().optional(),
	role: z.enum(["STAFF", "ADMIN", "SUPERADMIN"]),
	departmentId: z.string().nullable().optional(),
	isActive: z.boolean().default(true),
	hireDate: z.coerce.date().nullable().optional(),
	birthday: z.coerce.date().nullable().optional(),
	shiftSchedule: shiftScheduleSchema.nullable().optional(),
});

export const updateUserSchema = createUserSchema.omit({ email: true, password: true }).partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ShiftScheduleInput = z.infer<typeof shiftScheduleSchema>;
export type ShiftDayInput = z.infer<typeof shiftDaySchema>;
