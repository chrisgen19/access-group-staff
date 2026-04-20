import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
	"p",
	"br",
	"strong",
	"em",
	"u",
	"s",
	"code",
	"pre",
	"blockquote",
	"ul",
	"ol",
	"li",
	"h1",
	"h2",
	"h3",
	"a",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeReplyHtml(dirty: string): string {
	const clean = DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
	});
	return clean.trim();
}

const STRIP_RE = /<[^>]*>/g;
export function htmlToPlainText(html: string): string {
	return html.replace(STRIP_RE, "").replace(/\s+/g, " ").trim();
}
