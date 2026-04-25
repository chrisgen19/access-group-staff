import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		user: { findUnique: vi.fn() },
		recognitionCard: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		notification: { create: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
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
	createRecognitionCardAction,
	deleteRecognitionCardAction,
	updateRecognitionCardAction,
} from "./recognition-actions";

const SENDER_ID = "sender_123";
const RECIPIENT_ID = "recipient_456";

const validInput = (overrides: Partial<Record<string, unknown>> = {}) => ({
	recipientId: RECIPIENT_ID,
	message: "Great work!",
	date: "2026-04-18",
	valuesPeople: true,
	valuesSafety: false,
	valuesRespect: false,
	valuesCommunication: false,
	valuesContinuousImprovement: false,
	...overrides,
});

const mockSession = (
	userId: string = SENDER_ID,
	role: "STAFF" | "ADMIN" | "SUPERADMIN" = "STAFF",
) => ({
	user: { id: userId, name: "Test Sender", role },
	session: { id: "sess_1" },
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createRecognitionCardAction", () => {
	test("creates a card and notification on happy path", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession() as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: RECIPIENT_ID,
		} as never);

		const createdCard = { id: "card_789", senderId: SENDER_ID, recipientId: RECIPIENT_ID };
		const tx = {
			recognitionCard: { create: vi.fn().mockResolvedValue(createdCard) },
			notification: { create: vi.fn().mockResolvedValue({}) },
		};
		vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
			cb(tx)) as never);

		const result = await createRecognitionCardAction(validInput());

		expect(result).toEqual({ success: true, data: createdCard });
		expect(tx.recognitionCard.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				senderId: SENDER_ID,
				recipientId: RECIPIENT_ID,
				message: "Great work!",
				valuesPeople: true,
			}),
		});
		expect(tx.notification.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: RECIPIENT_ID,
				type: "CARD_RECEIVED",
				cardId: createdCard.id,
			}),
		});
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "CARD_CREATED",
				actorId: SENDER_ID,
				targetType: "recognition_card",
				targetId: createdCard.id,
				metadata: expect.objectContaining({
					recipientId: RECIPIENT_ID,
					valuesPicked: ["PEOPLE"],
				}),
			}),
		);
	});

	test("rejects sending a card to yourself", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession() as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await createRecognitionCardAction(validInput({ recipientId: SENDER_ID }));

		expect(result).toEqual({
			success: false,
			error: "You cannot send a recognition card to yourself",
		});
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	test("rejects when recipient does not exist or is deleted", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession() as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await createRecognitionCardAction(validInput());

		expect(result).toEqual({
			success: false,
			error: "Recipient not found or deleted",
		});
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	test("returns field errors when the input fails zod validation", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession() as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await createRecognitionCardAction(
			validInput({
				message: "",
				valuesPeople: false,
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(typeof result.error).toBe("object");
			const err = result.error as Record<string, string[] | undefined>;
			expect(err.message?.length).toBeGreaterThan(0);
			expect(err.valuesPeople?.length).toBeGreaterThan(0);
		}
	});

	test("returns error message when requireSession throws", async () => {
		vi.mocked(requireSession).mockRejectedValue(new Error("Unauthorized"));

		const result = await createRecognitionCardAction(validInput());

		expect(result).toEqual({ success: false, error: "Unauthorized" });
	});
});

describe("updateRecognitionCardAction", () => {
	test("updates a card and logs CARD_UPDATED on happy path", async () => {
		const CARD_ID = "card_existing";
		vi.mocked(requireSession).mockResolvedValue(
			mockSession() as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.recognitionCard.findUnique).mockResolvedValue({
			senderId: SENDER_ID,
			recipientId: RECIPIENT_ID,
		} as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: RECIPIENT_ID } as never);

		const updatedCard = { id: CARD_ID, senderId: SENDER_ID, recipientId: RECIPIENT_ID };
		const tx = {
			recognitionCard: { update: vi.fn().mockResolvedValue(updatedCard) },
			notification: {
				create: vi.fn().mockResolvedValue({}),
				deleteMany: vi.fn().mockResolvedValue({}),
			},
		};
		vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
			cb(tx)) as never);

		const result = await updateRecognitionCardAction(CARD_ID, validInput());

		expect(result).toEqual({ success: true, data: updatedCard });
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "CARD_UPDATED",
				actorId: SENDER_ID,
				targetType: "recognition_card",
				targetId: CARD_ID,
			}),
		);
	});
});

describe("deleteRecognitionCardAction", () => {
	test("deletes a card and logs CARD_DELETED on happy path (admin)", async () => {
		const CARD_ID = "card_to_delete";
		const ADMIN_ID = "admin_1";
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.recognitionCard.findUnique).mockResolvedValue({
			id: CARD_ID,
			senderId: SENDER_ID,
			recipientId: RECIPIENT_ID,
		} as never);

		const tx = {
			notification: {
				deleteMany: vi.fn().mockResolvedValue({}),
				createMany: vi.fn().mockResolvedValue({}),
			},
			recognitionCard: { delete: vi.fn().mockResolvedValue({}) },
		};
		vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
			cb(tx)) as never);

		const result = await deleteRecognitionCardAction(CARD_ID);

		expect(result).toEqual({ success: true });
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "CARD_DELETED",
				actorId: ADMIN_ID,
				targetType: "recognition_card",
				targetId: CARD_ID,
			}),
		);
	});
});
