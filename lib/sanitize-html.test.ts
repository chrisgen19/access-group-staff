import { describe, expect, test } from "vitest";
import { htmlToPlainText, sanitizeReplyHtml } from "./sanitize-html";

describe("sanitizeReplyHtml", () => {
	test("keeps safe formatting tags", () => {
		const input = "<p><strong>Hello</strong> <em>world</em></p><ul><li>one</li></ul>";
		expect(sanitizeReplyHtml(input)).toContain("<strong>Hello</strong>");
		expect(sanitizeReplyHtml(input)).toContain("<em>world</em>");
		expect(sanitizeReplyHtml(input)).toContain("<li>one</li>");
	});

	test("strips <script> tags and event handlers", () => {
		const input = '<p>ok</p><script>alert(1)</script><p onclick="alert(1)">bad</p>';
		const out = sanitizeReplyHtml(input);
		expect(out).not.toContain("<script>");
		expect(out).not.toContain("alert(1)");
		expect(out).not.toContain("onclick");
	});

	test("strips javascript: URLs from links", () => {
		const input = '<a href="javascript:alert(1)">x</a>';
		const out = sanitizeReplyHtml(input);
		expect(out).not.toContain("javascript:");
	});

	test("preserves http/https and mailto links", () => {
		const input = '<a href="https://example.com">link</a> <a href="mailto:a@b.com">mail</a>';
		const out = sanitizeReplyHtml(input);
		expect(out).toContain('href="https://example.com"');
		expect(out).toContain('href="mailto:a@b.com"');
	});

	test("drops disallowed tags like <img> and <iframe>", () => {
		const input = '<p>ok</p><img src=x onerror=alert(1)><iframe src="x"></iframe>';
		const out = sanitizeReplyHtml(input);
		expect(out).not.toContain("<img");
		expect(out).not.toContain("<iframe");
	});
});

describe("htmlToPlainText", () => {
	test("strips tags and collapses whitespace", () => {
		expect(htmlToPlainText("<p>hello   <strong>world</strong></p>")).toBe("hello world");
	});
});
