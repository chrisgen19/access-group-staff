import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

function prismaValidationError(message = "invalid"): Error {
	const err = new Error(message);
	err.name = "PrismaClientValidationError";
	return err;
}

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		recognitionCard: { findMany: vi.fn(), count: vi.fn() },
		cardReaction: { findMany: vi.fn() },
	},
}));

vi.mock("@/lib/permissions", () => ({
	getUserRole: vi.fn(() => "MEMBER"),
	hasMinRole: vi.fn(() => false),
}));

import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { GET } from "./route";

const USER_ID = "user_123";

function makeRequest(url: string): NextRequest {
	return { nextUrl: new URL(url) } as unknown as NextRequest;
}

function makeCards(count: number, prefix = "card") {
	return Array.from({ length: count }, (_, i) => ({
		id: `${prefix}_${i}`,
		message: "msg",
		date: new Date(),
		createdAt: new Date(Date.now() - i * 1000),
		senderId: "s",
		recipientId: "r",
		sender: { id: "s", firstName: "S", lastName: "S", avatar: null, position: null },
		recipient: { id: "r", firstName: "R", lastName: "R", avatar: null, position: null },
		_count: { reactions: 0, comments: 0 },
	}));
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requireSession).mockResolvedValue({
		user: { id: USER_ID, departmentId: null },
		session: { id: "sess_1" },
	} as unknown as Awaited<ReturnType<typeof requireSession>>);
	vi.mocked(prisma.cardReaction.findMany).mockResolvedValue([] as never);
});

describe("GET /api/recognition (cursor pagination)", () => {
	test("returns 401 when unauthenticated", async () => {
		vi.mocked(requireSession).mockRejectedValueOnce(new Error("nope"));

		const res = await GET(makeRequest("http://x/api/recognition"));

		expect(res.status).toBe(401);
	});

	test("defaults to limit 50, no cursor, nextCursor null when under limit", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue(makeCards(3) as never);

		const res = await GET(makeRequest("http://x/api/recognition"));
		const body = await res.json();

		expect(body.success).toBe(true);
		expect(body.data).toHaveLength(3);
		expect(body.nextCursor).toBeNull();

		const call = vi.mocked(prisma.recognitionCard.findMany).mock.calls[0]?.[0];
		expect(call?.take).toBe(51);
		expect(call?.cursor).toBeUndefined();
		expect(call?.skip).toBeUndefined();
		expect(call?.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
	});

	test("returns nextCursor when more rows exist (limit+1 overfetch)", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue(makeCards(11) as never);

		const res = await GET(makeRequest("http://x/api/recognition?limit=10"));
		const body = await res.json();

		expect(body.data).toHaveLength(10);
		expect(body.nextCursor).toBe("card_9");
	});

	test("forwards cursor + skip to Prisma when ?cursor is provided", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue(makeCards(5) as never);

		await GET(makeRequest("http://x/api/recognition?limit=10&cursor=abc"));

		const call = vi.mocked(prisma.recognitionCard.findMany).mock.calls[0]?.[0];
		expect(call?.cursor).toEqual({ id: "abc" });
		expect(call?.skip).toBe(1);
	});

	test("clamps limit above 50 to 50", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([] as never);

		await GET(makeRequest("http://x/api/recognition?limit=999"));

		const call = vi.mocked(prisma.recognitionCard.findMany).mock.calls[0]?.[0];
		expect(call?.take).toBe(51);
	});

	test("clamps limit below 1 to default", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([] as never);

		await GET(makeRequest("http://x/api/recognition?limit=0"));

		const call = vi.mocked(prisma.recognitionCard.findMany).mock.calls[0]?.[0];
		expect(call?.take).toBe(51);
	});

	test("floors fractional limit to an integer", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([] as never);

		await GET(makeRequest("http://x/api/recognition?limit=10.7"));

		const call = vi.mocked(prisma.recognitionCard.findMany).mock.calls[0]?.[0];
		expect(call?.take).toBe(11);
		expect(Number.isInteger(call?.take)).toBe(true);
	});

	test("ignores oversized cursor (>64 chars) and returns first page", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([] as never);
		const huge = "x".repeat(200);

		await GET(makeRequest(`http://x/api/recognition?cursor=${huge}`));

		const call = vi.mocked(prisma.recognitionCard.findMany).mock.calls[0]?.[0];
		expect(call?.cursor).toBeUndefined();
		expect(call?.skip).toBeUndefined();
	});

	test("maps Prisma validation errors with a cursor to 400 Invalid cursor", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockRejectedValueOnce(
			prismaValidationError("bad cursor"),
		);

		const res = await GET(makeRequest("http://x/api/recognition?cursor=abc"));
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ success: false, error: "Invalid cursor" });
	});

	test("surfaces infra errors (e.g. DB down) with a cursor as 500, not 400", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockRejectedValueOnce(new Error("db down"));

		const res = await GET(makeRequest("http://x/api/recognition?cursor=abc"));
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({ success: false, error: "Internal server error" });
	});

	test("surfaces findMany failures without a cursor as 500", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockRejectedValueOnce(
			prismaValidationError("no-cursor path"),
		);

		const res = await GET(makeRequest("http://x/api/recognition"));
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({ success: false, error: "Internal server error" });
	});

	test("empty result returns empty data + null nextCursor", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([] as never);

		const res = await GET(makeRequest("http://x/api/recognition?limit=10"));
		const body = await res.json();

		expect(body.data).toEqual([]);
		expect(body.nextCursor).toBeNull();
	});

	test("does not fetch reactions for the overfetched +1 row", async () => {
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue(makeCards(11) as never);

		await GET(makeRequest("http://x/api/recognition?limit=10"));

		const reactionCall = vi.mocked(prisma.cardReaction.findMany).mock.calls[0]?.[0];
		const cardIds = (reactionCall?.where as { cardId: { in: string[] } } | undefined)?.cardId.in;
		expect(cardIds).toHaveLength(10);
		expect(cardIds).not.toContain("card_10");
	});
});
