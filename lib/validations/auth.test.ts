import { describe, expect, test } from "vitest";
import { setPasswordSchema } from "./auth";

describe("setPasswordSchema", () => {
	test("accepts a valid password with matching confirmation", () => {
		const result = setPasswordSchema.safeParse({
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});
		expect(result.success).toBe(true);
	});

	test("rejects passwords shorter than 8 characters", () => {
		const result = setPasswordSchema.safeParse({
			newPassword: "short",
			confirmPassword: "short",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("newPassword");
		}
	});

	test("rejects mismatched confirmation", () => {
		const result = setPasswordSchema.safeParse({
			newPassword: "supersecret",
			confirmPassword: "different1",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("confirmPassword");
		}
	});
});
