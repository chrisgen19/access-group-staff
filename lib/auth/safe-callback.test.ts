import { describe, expect, test } from "vitest";
import { safeCallbackUrl, sanitizeCallbackUrl } from "./safe-callback";

describe("sanitizeCallbackUrl", () => {
	test.each([
		["//evil.example"],
		["///evil.example"],
		["https://evil.example"],
		["http://evil.example"],
		["javascript:alert(1)"],
		["mailto:a@b.c"],
		["dashboard"],
		[""],
		[null],
		[undefined],
	])("rejects %p", (input) => {
		expect(sanitizeCallbackUrl(input)).toBeNull();
	});

	test.each([
		["/", "/"],
		["/dashboard", "/dashboard"],
		["/dashboard/users", "/dashboard/users"],
		["/dashboard?tab=1&q=foo", "/dashboard?tab=1&q=foo"],
		["/dashboard#section", "/dashboard#section"],
	])("accepts %p", (input, expected) => {
		expect(sanitizeCallbackUrl(input)).toBe(expected);
	});
});

describe("safeCallbackUrl", () => {
	test("returns sanitized value when valid", () => {
		expect(safeCallbackUrl("/dashboard/users")).toBe("/dashboard/users");
	});

	test("falls back to /dashboard when invalid", () => {
		expect(safeCallbackUrl("//evil.example")).toBe("/dashboard");
		expect(safeCallbackUrl("https://evil.example")).toBe("/dashboard");
		expect(safeCallbackUrl(null)).toBe("/dashboard");
		expect(safeCallbackUrl(undefined)).toBe("/dashboard");
		expect(safeCallbackUrl("")).toBe("/dashboard");
	});
});
