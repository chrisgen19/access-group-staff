import { describe, expect, test } from "vitest";
import { formatLocalDate, isNotFutureIsoDate, isValidIsoDate } from "./date-utils";

describe("formatLocalDate", () => {
	test("formats as YYYY-MM-DD with zero padding", () => {
		const d = new Date(2026, 0, 5);
		expect(formatLocalDate(d)).toBe("2026-01-05");
	});

	test("formats double-digit months and days", () => {
		const d = new Date(2026, 10, 20);
		expect(formatLocalDate(d)).toBe("2026-11-20");
	});
});

describe("isValidIsoDate", () => {
	test("accepts a well-formed real date", () => {
		expect(isValidIsoDate("2026-04-20")).toBe(true);
	});

	test("accepts a leap-year Feb 29", () => {
		expect(isValidIsoDate("2024-02-29")).toBe(true);
	});

	test("rejects a non-leap-year Feb 29", () => {
		expect(isValidIsoDate("2025-02-29")).toBe(false);
	});

	test("rejects Feb 30", () => {
		expect(isValidIsoDate("2026-02-30")).toBe(false);
	});

	test("rejects month 13", () => {
		expect(isValidIsoDate("2026-13-01")).toBe(false);
	});

	test("rejects day 00", () => {
		expect(isValidIsoDate("2026-04-00")).toBe(false);
	});

	test("rejects wrong format", () => {
		expect(isValidIsoDate("2026/04/20")).toBe(false);
		expect(isValidIsoDate("04-20-2026")).toBe(false);
		expect(isValidIsoDate("not-a-date")).toBe(false);
		expect(isValidIsoDate("")).toBe(false);
	});
});

describe("isNotFutureIsoDate", () => {
	test("accepts today", () => {
		expect(isNotFutureIsoDate(formatLocalDate(new Date()))).toBe(true);
	});

	test("accepts a past date", () => {
		const d = new Date();
		d.setDate(d.getDate() - 7);
		expect(isNotFutureIsoDate(formatLocalDate(d))).toBe(true);
	});

	test("rejects a clearly future date", () => {
		expect(isNotFutureIsoDate("9999-12-31")).toBe(false);
	});
});
