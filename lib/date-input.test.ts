import { describe, expect, test } from "bun:test";
import { parseDateInputValue, toDateInputValue } from "./date-input";

describe("parseDateInputValue", () => {
	test("parses a valid YYYY-MM-DD string to UTC midnight", () => {
		const result = parseDateInputValue("2026-04-18");
		expect(result).not.toBeNull();
		expect(result?.toISOString()).toBe("2026-04-18T00:00:00.000Z");
	});

	test.each([
		["2026-02-29", "Feb 29 in a non-leap year"],
		["2026-13-01", "month 13"],
		["2026-00-15", "month 0"],
		["2026-04-31", "April 31"],
		["2026-02-30", "Feb 30"],
	])("rejects out-of-range date %p (%s)", (input) => {
		expect(parseDateInputValue(input)).toBeNull();
	});

	test("accepts Feb 29 in a leap year", () => {
		const result = parseDateInputValue("2024-02-29");
		expect(result?.toISOString()).toBe("2024-02-29T00:00:00.000Z");
	});

	test.each([
		[""],
		["not-a-date"],
		["2026/04/18"],
		["2026-4-18"],
		["04-18-2026"],
		["2026-04-18T00:00:00Z"],
	])("rejects malformed input %p", (input) => {
		expect(parseDateInputValue(input)).toBeNull();
	});
});

describe("toDateInputValue", () => {
	test("formats a Date as YYYY-MM-DD in UTC", () => {
		expect(toDateInputValue(new Date("2026-04-18T00:00:00Z"))).toBe("2026-04-18");
	});

	test("pads single-digit months and days", () => {
		expect(toDateInputValue(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
	});

	test.each([[null], [undefined], [""]])("returns empty string for %p", (input) => {
		expect(toDateInputValue(input)).toBe("");
	});

	test("returns empty string for invalid date input", () => {
		expect(toDateInputValue("not-a-date")).toBe("");
	});

	test("round-trips with parseDateInputValue", () => {
		const original = "2026-04-18";
		const date = parseDateInputValue(original);
		expect(date).not.toBeNull();
		expect(toDateInputValue(date)).toBe(original);
	});
});
