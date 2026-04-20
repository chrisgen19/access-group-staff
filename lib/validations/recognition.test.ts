import { describe, expect, test } from "vitest";
import { formatLocalDate } from "@/lib/date-utils";
import { createRecognitionCardSchema } from "./recognition";

const today = () => formatLocalDate(new Date());

const yesterday = () => {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return formatLocalDate(d);
};

const validInput = (overrides: Partial<Record<string, unknown>> = {}) => ({
	recipientId: "user_123",
	message: "Great work on the sprint!",
	date: today(),
	valuesPeople: true,
	valuesSafety: false,
	valuesRespect: false,
	valuesCommunication: false,
	valuesContinuousImprovement: false,
	...overrides,
});

describe("createRecognitionCardSchema", () => {
	test("accepts a valid input with one value selected", () => {
		expect(createRecognitionCardSchema.safeParse(validInput()).success).toBe(true);
	});

	test("accepts a valid input with multiple values selected", () => {
		const result = createRecognitionCardSchema.safeParse(
			validInput({
				valuesPeople: true,
				valuesRespect: true,
				valuesCommunication: true,
			}),
		);
		expect(result.success).toBe(true);
	});

	test("rejects an empty recipientId", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ recipientId: "" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("recipientId");
		}
	});

	test("rejects an empty message", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ message: "" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("message");
		}
	});

	test("rejects a message longer than 500 characters", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ message: "x".repeat(501) }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some(
					(i) => i.path.join(".") === "message" && i.message.includes("500"),
				),
			).toBe(true);
		}
	});

	test("accepts a message of exactly 500 characters", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ message: "x".repeat(500) }));
		expect(result.success).toBe(true);
	});

	test("rejects an empty date", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ date: "" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("date");
		}
	});

	test("accepts today's date", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ date: today() }));
		expect(result.success).toBe(true);
	});

	test("accepts a past date", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ date: yesterday() }));
		expect(result.success).toBe(true);
	});

	test("rejects a clearly future date", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ date: "9999-12-31" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some(
					(i) => i.path.join(".") === "date" && i.message === "Date cannot be in the future",
				),
			).toBe(true);
		}
	});

	test("rejects a malformed date string", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ date: "not-a-date" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some(
					(i) => i.path.join(".") === "date" && i.message === "Invalid date",
				),
			).toBe(true);
		}
	});

	test("rejects an invalid calendar date (Feb 30)", () => {
		const result = createRecognitionCardSchema.safeParse(validInput({ date: "2026-02-30" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some(
					(i) => i.path.join(".") === "date" && i.message === "Invalid date",
				),
			).toBe(true);
		}
	});

	test("rejects when no company value is selected (refine)", () => {
		const result = createRecognitionCardSchema.safeParse(
			validInput({
				valuesPeople: false,
				valuesSafety: false,
				valuesRespect: false,
				valuesCommunication: false,
				valuesContinuousImprovement: false,
			}),
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.message.includes("At least one company value")),
			).toBe(true);
		}
	});

	test("rejects non-boolean value flags", () => {
		const result = createRecognitionCardSchema.safeParse(
			validInput({ valuesPeople: "yes" as unknown as boolean }),
		);
		expect(result.success).toBe(false);
	});
});
