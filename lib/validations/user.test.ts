import { describe, expect, test } from "vitest";
import { shiftDaySchema, shiftScheduleSchema } from "./user";

const workingDay = (overrides: Partial<Record<string, unknown>> = {}) => ({
	dayOfWeek: 1,
	isWorking: true,
	startTime: "09:00",
	endTime: "17:00",
	breakMins: 60,
	...overrides,
});

describe("shiftDaySchema", () => {
	test("accepts a standard working day", () => {
		expect(shiftDaySchema.safeParse(workingDay()).success).toBe(true);
	});

	test("accepts an off day with null times", () => {
		const result = shiftDaySchema.safeParse({
			dayOfWeek: 0,
			isWorking: false,
			startTime: null,
			endTime: null,
			breakMins: 0,
		});
		expect(result.success).toBe(true);
	});

	test("requires startTime when isWorking", () => {
		const result = shiftDaySchema.safeParse(workingDay({ startTime: null }));
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("startTime");
		}
	});

	test("requires endTime when isWorking", () => {
		const result = shiftDaySchema.safeParse(workingDay({ endTime: null }));
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("endTime");
		}
	});

	test("rejects end time before start time", () => {
		const result = shiftDaySchema.safeParse(workingDay({ startTime: "17:00", endTime: "09:00" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.message.includes("after start time"))).toBe(true);
		}
	});

	test("rejects end time equal to start time", () => {
		const result = shiftDaySchema.safeParse(workingDay({ startTime: "09:00", endTime: "09:00" }));
		expect(result.success).toBe(false);
	});

	test("rejects breaks greater than or equal to the shift duration", () => {
		const result = shiftDaySchema.safeParse(
			workingDay({ startTime: "09:00", endTime: "10:00", breakMins: 120 }),
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("breakMins");
		}
	});

	test("rejects breaks equal to the shift duration", () => {
		const result = shiftDaySchema.safeParse(
			workingDay({ startTime: "09:00", endTime: "10:00", breakMins: 60 }),
		);
		expect(result.success).toBe(false);
	});

	test("accepts a break shorter than the shift duration", () => {
		const result = shiftDaySchema.safeParse(
			workingDay({ startTime: "09:00", endTime: "12:00", breakMins: 30 }),
		);
		expect(result.success).toBe(true);
	});

	test.each([
		["9:00"],
		["24:00"],
		["09:60"],
		["morning"],
		[""],
	])("rejects invalid HH:mm %p", (bad) => {
		const result = shiftDaySchema.safeParse(workingDay({ startTime: bad }));
		expect(result.success).toBe(false);
	});
});

describe("shiftScheduleSchema", () => {
	const fullWeek = Array.from({ length: 7 }, (_, dayOfWeek) => ({
		dayOfWeek,
		isWorking: dayOfWeek >= 1 && dayOfWeek <= 5,
		startTime: dayOfWeek >= 1 && dayOfWeek <= 5 ? "09:00" : null,
		endTime: dayOfWeek >= 1 && dayOfWeek <= 5 ? "17:00" : null,
		breakMins: dayOfWeek >= 1 && dayOfWeek <= 5 ? 60 : 0,
	}));

	test("accepts a full week of 7 unique days", () => {
		const result = shiftScheduleSchema.safeParse({ timezone: "Asia/Manila", days: fullWeek });
		expect(result.success).toBe(true);
	});

	test("rejects fewer than 7 days", () => {
		const result = shiftScheduleSchema.safeParse({
			timezone: "Asia/Manila",
			days: fullWeek.slice(0, 6),
		});
		expect(result.success).toBe(false);
	});

	test("rejects duplicate dayOfWeek values", () => {
		const withDupe = [...fullWeek.slice(0, 6), { ...fullWeek[5], dayOfWeek: 0 }];
		const result = shiftScheduleSchema.safeParse({ timezone: "Asia/Manila", days: withDupe });
		expect(result.success).toBe(false);
	});

	test("rejects an invalid IANA timezone", () => {
		const result = shiftScheduleSchema.safeParse({ timezone: "Not/AZone", days: fullWeek });
		expect(result.success).toBe(false);
	});

	test("accepts another valid IANA timezone", () => {
		const result = shiftScheduleSchema.safeParse({ timezone: "Australia/Perth", days: fullWeek });
		expect(result.success).toBe(true);
	});
});
