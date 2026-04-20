import { describe, expect, test } from "vitest";
import { displayReplyAuthor, type ReplyAuthor } from "./helpme-display";

const staff: ReplyAuthor = {
	id: "u1",
	firstName: "Ann",
	lastName: "Smith",
	avatar: "avatar.png",
	role: "STAFF",
};

const admin: ReplyAuthor = {
	id: "u2",
	firstName: "Bob",
	lastName: "Jones",
	avatar: "bob.png",
	role: "ADMIN",
};

const superadmin: ReplyAuthor = { ...admin, id: "u3", role: "SUPERADMIN" };

describe("displayReplyAuthor", () => {
	test("masks ADMIN author when viewer is STAFF", () => {
		const out = displayReplyAuthor(admin, "STAFF");
		expect(out.displayName).toBe("Admin");
		expect(out.avatar).toBeNull();
		expect(out.isMaskedAdmin).toBe(true);
	});

	test("masks SUPERADMIN author when viewer is STAFF", () => {
		const out = displayReplyAuthor(superadmin, "STAFF");
		expect(out.displayName).toBe("Admin");
		expect(out.isMaskedAdmin).toBe(true);
	});

	test("reveals ADMIN author when viewer is ADMIN", () => {
		const out = displayReplyAuthor(admin, "ADMIN");
		expect(out.displayName).toBe("Bob Jones");
		expect(out.avatar).toBe("bob.png");
		expect(out.isMaskedAdmin).toBe(false);
	});

	test("never masks STAFF authors", () => {
		expect(displayReplyAuthor(staff, "STAFF").displayName).toBe("Ann Smith");
		expect(displayReplyAuthor(staff, "ADMIN").displayName).toBe("Ann Smith");
		expect(displayReplyAuthor(staff, "SUPERADMIN").displayName).toBe("Ann Smith");
	});
});
