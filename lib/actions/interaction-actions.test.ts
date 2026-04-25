import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		recognitionCard: { findUnique: vi.fn() },
		cardReaction: { deleteMany: vi.fn(), create: vi.fn() },
		cardComment: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
		notification: { createMany: vi.fn() },
		$transaction: vi.fn(),
	},
}));

vi.mock("@/lib/activity-log", () => ({
	logActivityForRequest: vi.fn(),
}));

import { logActivityForRequest } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
	addCommentAction,
	deleteCommentAction,
	editCommentAction,
	toggleReactionAction,
} from "./interaction-actions";

const SENDER_ID = "sender_1";
const RECIPIENT_ID = "recipient_1";
const OUTSIDER_ID = "outsider_1";
const ADMIN_ID = "admin_1";
const CARD_ID = "card_1";
const COMMENT_ID = "comment_1";

const mockSession = (userId: string, role: "STAFF" | "ADMIN" | "SUPERADMIN" = "STAFF") => ({
	user: { id: userId, name: "Test User", role },
	session: { id: "sess_1" },
});

const mockCard = () => ({ id: CARD_ID, senderId: SENDER_ID, recipientId: RECIPIENT_ID });

beforeEach(() => {
	vi.clearAllMocks();
});

describe("toggleReactionAction", () => {
	test("allows a non-participant to add a reaction", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.recognitionCard.findUnique).mockResolvedValue(mockCard() as never);
		vi.mocked(prisma.cardReaction.deleteMany).mockResolvedValue({ count: 0 } as never);
		const tx = {
			cardReaction: { create: vi.fn().mockResolvedValue({}) },
			notification: { createMany: vi.fn().mockResolvedValue({}) },
		};
		vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
			cb(tx)) as never);

		const result = await toggleReactionAction(CARD_ID, "👏");

		expect(result).toEqual({ success: true, action: "added" });
		expect(tx.cardReaction.create).toHaveBeenCalledWith({
			data: { cardId: CARD_ID, userId: OUTSIDER_ID, emoji: "👏" },
		});
		expect(tx.notification.createMany).toHaveBeenCalled();
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "CARD_REACTED",
				actorId: OUTSIDER_ID,
				targetType: "recognition_card",
				targetId: CARD_ID,
				metadata: { emoji: "👏" },
			}),
		);
	});

	test("removes an existing reaction (toggle off)", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.recognitionCard.findUnique).mockResolvedValue(mockCard() as never);
		vi.mocked(prisma.cardReaction.deleteMany).mockResolvedValue({ count: 1 } as never);

		const result = await toggleReactionAction(CARD_ID, "👏");

		expect(result).toEqual({ success: true, action: "removed" });
		expect(prisma.$transaction).not.toHaveBeenCalled();
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "CARD_UNREACTED",
				actorId: OUTSIDER_ID,
				targetType: "recognition_card",
				targetId: CARD_ID,
				metadata: { emoji: "👏" },
			}),
		);
	});

	test("rejects invalid emoji", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await toggleReactionAction(CARD_ID, "🚫");

		expect(result).toEqual({ success: false, error: "Invalid input" });
		expect(prisma.recognitionCard.findUnique).not.toHaveBeenCalled();
	});

	test("returns error when card not found", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.recognitionCard.findUnique).mockResolvedValue(null);

		const result = await toggleReactionAction(CARD_ID, "👏");

		expect(result).toEqual({ success: false, error: "Card not found" });
	});
});

describe("addCommentAction", () => {
	test("allows a non-participant to add a comment", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.recognitionCard.findUnique).mockResolvedValue(mockCard() as never);
		const created = { id: "c1", body: "Nice!", userId: OUTSIDER_ID };
		const tx = {
			cardComment: { create: vi.fn().mockResolvedValue(created) },
			notification: { createMany: vi.fn().mockResolvedValue({}) },
		};
		vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
			cb(tx)) as never);

		const result = await addCommentAction(CARD_ID, "Nice!");

		expect(result).toEqual({ success: true, data: created });
		expect(tx.cardComment.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { cardId: CARD_ID, userId: OUTSIDER_ID, body: "Nice!" },
			}),
		);
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "COMMENT_CREATED",
				actorId: OUTSIDER_ID,
				targetType: "card_comment",
				targetId: created.id,
				metadata: { cardId: CARD_ID },
			}),
		);
	});

	test("rejects empty body", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await addCommentAction(CARD_ID, "");

		expect(result.success).toBe(false);
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	test("rejects body over 500 chars", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await addCommentAction(CARD_ID, "x".repeat(501));

		expect(result.success).toBe(false);
	});
});

describe("editCommentAction", () => {
	test("allows owner to edit", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.cardComment.findUnique).mockResolvedValue({
			userId: OUTSIDER_ID,
		} as never);
		const updated = { id: COMMENT_ID, body: "Edited", userId: OUTSIDER_ID };
		vi.mocked(prisma.cardComment.update).mockResolvedValue(updated as never);

		const result = await editCommentAction(COMMENT_ID, "Edited");

		expect(result).toEqual({ success: true, data: updated });
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "COMMENT_UPDATED",
				actorId: OUTSIDER_ID,
				targetType: "card_comment",
				targetId: COMMENT_ID,
			}),
		);
	});

	test("blocks non-owner (even admin) from editing", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.cardComment.findUnique).mockResolvedValue({
			userId: OUTSIDER_ID,
		} as never);

		const result = await editCommentAction(COMMENT_ID, "Edited");

		expect(result).toEqual({
			success: false,
			error: "You can only edit your own comments",
		});
		expect(prisma.cardComment.update).not.toHaveBeenCalled();
	});
});

describe("deleteCommentAction", () => {
	test("allows owner to delete", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(OUTSIDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.cardComment.findUnique).mockResolvedValue({
			userId: OUTSIDER_ID,
		} as never);
		vi.mocked(prisma.cardComment.delete).mockResolvedValue({} as never);

		const result = await deleteCommentAction(COMMENT_ID);

		expect(result).toEqual({ success: true });
		expect(prisma.cardComment.delete).toHaveBeenCalledWith({ where: { id: COMMENT_ID } });
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "COMMENT_DELETED",
				actorId: OUTSIDER_ID,
				targetType: "card_comment",
				targetId: COMMENT_ID,
			}),
		);
	});

	test("allows admin to delete another user's comment", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.cardComment.findUnique).mockResolvedValue({
			userId: OUTSIDER_ID,
		} as never);
		vi.mocked(prisma.cardComment.delete).mockResolvedValue({} as never);

		const result = await deleteCommentAction(COMMENT_ID);

		expect(result).toEqual({ success: true });
	});

	test("blocks non-owner non-admin from deleting", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(SENDER_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.cardComment.findUnique).mockResolvedValue({
			userId: OUTSIDER_ID,
		} as never);

		const result = await deleteCommentAction(COMMENT_ID);

		expect(result).toEqual({ success: false, error: "Not allowed" });
		expect(prisma.cardComment.delete).not.toHaveBeenCalled();
	});
});
