import { describe, expect, it } from "vitest";
import { mapGoogleProfile, mapMicrosoftProfile } from "./profile-mappers";

describe("mapGoogleProfile", () => {
	it("maps given_name and family_name directly", () => {
		expect(mapGoogleProfile({ given_name: "Ada", family_name: "Lovelace" })).toEqual({
			firstName: "Ada",
			lastName: "Lovelace",
			name: "Ada Lovelace",
		});
	});
});

describe("mapMicrosoftProfile", () => {
	it("uses given_name/family_name when present (no regression)", () => {
		expect(
			mapMicrosoftProfile({
				given_name: "Ada",
				family_name: "Lovelace",
				name: "Ada Lovelace",
				email: "ada@example.com",
			}),
		).toEqual({
			firstName: "Ada",
			lastName: "Lovelace",
			name: "Ada Lovelace",
		});
	});

	it("falls back to splitting profile.name when given/family missing", () => {
		expect(
			mapMicrosoftProfile({
				name: "Ada Lovelace",
				email: "ada@example.com",
			}),
		).toEqual({
			firstName: "Ada",
			lastName: "Lovelace",
			name: "Ada Lovelace",
		});
	});

	it("treats additional name parts as last name", () => {
		expect(
			mapMicrosoftProfile({
				name: "Mary Anne Dela Cruz",
			}),
		).toEqual({
			firstName: "Mary",
			lastName: "Anne Dela Cruz",
			name: "Mary Anne Dela Cruz",
		});
	});

	it("uses firstName for lastName when name is single-word", () => {
		expect(
			mapMicrosoftProfile({
				name: "Cher",
			}),
		).toEqual({
			firstName: "Cher",
			lastName: "Cher",
			name: "Cher",
		});
	});

	it("falls back to preferred_username when name is missing", () => {
		const result = mapMicrosoftProfile({
			preferred_username: "jane.doe",
			email: "jane.doe@example.com",
		});
		expect(result.firstName).toBe("jane.doe");
		expect(result.lastName).toBe("jane.doe");
	});

	it("falls back to email local-part as last resort", () => {
		const result = mapMicrosoftProfile({
			email: "bob@example.com",
		});
		expect(result.firstName).toBe("bob");
		expect(result.lastName).toBe("bob");
	});

	it("mixes partial claims: given_name present, family_name missing", () => {
		expect(
			mapMicrosoftProfile({
				given_name: "Ada",
				name: "Ada Lovelace",
			}),
		).toEqual({
			firstName: "Ada",
			lastName: "Lovelace",
			name: "Ada Lovelace",
		});
	});

	it("returns empty-string fields rather than undefined when everything is missing", () => {
		const result = mapMicrosoftProfile({});
		expect(result.firstName).toBe("");
		expect(result.lastName).toBe("");
		expect(typeof result.name).toBe("string");
	});
});
