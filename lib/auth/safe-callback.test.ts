import { describe, expect, it } from "vitest";
import { safeCallbackOrDefault, sanitizeCallback } from "@/lib/auth/safe-callback";

describe("sanitizeCallback", () => {
	it.each([
		["null", null],
		["undefined", undefined],
		["empty string", ""],
		["protocol-relative", "//evil.example"],
		["protocol-relative with path", "//evil.example/dashboard"],
		["backslash bypass", "/\\evil.example"],
		["double backslash", "/\\\\evil.example"],
		["absolute http", "http://evil.example"],
		["absolute https", "https://evil.example"],
		["no leading slash", "evil"],
		["relative path", "dashboard/users"],
	])("rejects %s", (_label, input) => {
		expect(sanitizeCallback(input)).toBeNull();
	});

	it.each([
		["root dashboard", "/dashboard"],
		["nested dashboard path", "/dashboard/users/42"],
		["query string preserved", "/dashboard/users?tab=profile"],
		["mid-path backslash allowed", "/dashboard/with\\backslash"],
	])("accepts %s", (_label, input) => {
		expect(sanitizeCallback(input)).toBe(input);
	});
});

describe("safeCallbackOrDefault", () => {
	it("returns the input when valid", () => {
		expect(safeCallbackOrDefault("/dashboard/users/42")).toBe("/dashboard/users/42");
	});

	it("falls back to /dashboard for invalid input", () => {
		expect(safeCallbackOrDefault("//evil.example")).toBe("/dashboard");
	});

	it("falls back to /dashboard for null", () => {
		expect(safeCallbackOrDefault(null)).toBe("/dashboard");
	});

	it("respects a custom fallback", () => {
		expect(safeCallbackOrDefault(null, "/login")).toBe("/login");
	});
});
