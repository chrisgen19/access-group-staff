import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/actions/settings-actions", () => ({
	getHelpMeEnabled: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		helpMeTicket: {
			create: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
		ticketReply: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

vi.mock("@/lib/activity-log", () => ({
	logActivityForRequest: vi.fn(),
}));

import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { logActivityForRequest } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
	createTicketAction,
	deleteReplyAction,
	editReplyAction,
	getTicketByIdForCurrentUser,
	listTicketsForCurrentUser,
	replyToTicketAction,
} from "./helpme-actions";

const STAFF_ID = "staff_1";
const OTHER_STAFF_ID = "staff_2";
const ADMIN_ID = "admin_1";

const mockSession = (userId: string, role: "STAFF" | "ADMIN" | "SUPERADMIN" = "STAFF") => ({
	user: { id: userId, name: "Tester", role },
	session: { id: "sess_1" },
});

const validInput = (overrides: Partial<Record<string, unknown>> = {}) => ({
	subject: "Need help with HR",
	body: "I have a question about leave balances — please advise.",
	category: "HR" as const,
	...overrides,
});

beforeEach(() => {
	vi.clearAllMocks();
	// Default to module-enabled; individual tests opt into disabled state.
	vi.mocked(getHelpMeEnabled).mockResolvedValue(true);
});

describe("createTicketAction", () => {
	test("creates a ticket on happy path", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.create).mockResolvedValue({ id: "ticket_1" } as never);

		const result = await createTicketAction(validInput());

		expect(result).toEqual({ success: true, data: { id: "ticket_1" } });
		expect(prisma.helpMeTicket.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				subject: "Need help with HR",
				category: "HR",
				createdById: STAFF_ID,
			}),
			select: { id: true },
		});
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "TICKET_CREATED",
				actorId: STAFF_ID,
				targetType: "help_me_ticket",
				targetId: "ticket_1",
				metadata: { category: "HR" },
			}),
		);
	});

	test("sanitizes HTML in body on create", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.create).mockResolvedValue({ id: "ticket_2" } as never);

		await createTicketAction(
			validInput({
				body: "<p>Legit problem description here.</p><script>alert(1)</script>",
			}),
		);

		const call = vi.mocked(prisma.helpMeTicket.create).mock.calls[0]?.[0] as {
			data: { body: string };
		};
		expect(call.data.body).not.toContain("<script>");
		expect(call.data.body).toContain("Legit problem description");
	});

	test("returns field errors when input fails zod validation", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await createTicketAction(validInput({ subject: "", body: "tooshort" }));

		expect(result.success).toBe(false);
		if (!result.success) {
			const err = result.error as Record<string, string[] | undefined>;
			expect(err.subject?.length).toBeGreaterThan(0);
			expect(err.body?.length).toBeGreaterThan(0);
		}
		expect(prisma.helpMeTicket.create).not.toHaveBeenCalled();
	});

	test("returns error when session is missing", async () => {
		vi.mocked(requireSession).mockRejectedValue(new Error("Unauthorized"));

		const result = await createTicketAction(validInput());

		expect(result).toEqual({ success: false, error: "Unauthorized" });
	});
});

describe("listTicketsForCurrentUser", () => {
	test("scopes query to current user for STAFF", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findMany).mockResolvedValue([] as never);

		const result = await listTicketsForCurrentUser();

		expect(result.isAdmin).toBe(false);
		expect(prisma.helpMeTicket.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { createdById: STAFF_ID } }),
		);
	});

	test("omits scope for ADMIN (sees all)", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findMany).mockResolvedValue([] as never);

		const result = await listTicketsForCurrentUser();

		expect(result.isAdmin).toBe(true);
		expect(prisma.helpMeTicket.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: undefined }),
		);
	});
});

describe("getTicketByIdForCurrentUser", () => {
	test("returns ticket when STAFF is the creator", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue({
			id: "t1",
			createdById: STAFF_ID,
		} as never);

		const result = await getTicketByIdForCurrentUser("t1");

		expect(result).not.toBeNull();
	});

	test("scopes query to creator when STAFF requests a ticket", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue(null);

		const result = await getTicketByIdForCurrentUser("t1");

		expect(result).toBeNull();
		expect(prisma.helpMeTicket.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "t1", createdById: STAFF_ID } }),
		);
	});

	test("returns ticket for ADMIN regardless of creator", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue({
			id: "t1",
			createdById: OTHER_STAFF_ID,
		} as never);

		const result = await getTicketByIdForCurrentUser("t1");

		expect(result).not.toBeNull();
		expect(prisma.helpMeTicket.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "t1" } }),
		);
	});

	test("returns null when ticket does not exist", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue(null);

		const result = await getTicketByIdForCurrentUser("missing");

		expect(result).toBeNull();
	});
});

describe("replyToTicketAction", () => {
	test("STAFF can reply to own ticket and HTML is sanitized on write", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue({
			id: "t1",
			status: "OPEN",
		} as never);
		vi.mocked(prisma.ticketReply.create).mockResolvedValue({ id: "r1" } as never);

		const result = await replyToTicketAction("t1", {
			bodyHtml: "<p>Hello <script>alert(1)</script></p>",
		});

		expect(result).toEqual({ success: true, data: { id: "r1" } });
		const call = vi.mocked(prisma.ticketReply.create).mock.calls[0]?.[0] as {
			data: { bodyHtml: string };
		};
		expect(call.data.bodyHtml).not.toContain("<script>");
		expect(call.data.bodyHtml).toContain("Hello");
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "TICKET_REPLIED",
				actorId: STAFF_ID,
				targetType: "help_me_ticket",
				targetId: "t1",
				metadata: { replyId: "r1" },
			}),
		);
	});

	test("rejects when STAFF tries to reply to a ticket they don't own", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue(null);

		const result = await replyToTicketAction("t1", { bodyHtml: "<p>ok</p>" });

		expect(result).toEqual({ success: false, error: "Ticket not found" });
		expect(prisma.ticketReply.create).not.toHaveBeenCalled();
	});

	test("rejects empty bodies (after tag stripping)", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await replyToTicketAction("t1", { bodyHtml: "<p>   </p>" });

		expect(result.success).toBe(false);
		expect(prisma.ticketReply.create).not.toHaveBeenCalled();
	});

	test("rejects replies on CLOSED tickets even when UI would hide the form", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.helpMeTicket.findFirst).mockResolvedValue({
			id: "t1",
			status: "CLOSED",
		} as never);

		const result = await replyToTicketAction("t1", { bodyHtml: "<p>sneaky</p>" });

		expect(result).toEqual({ success: false, error: "This ticket is closed" });
		expect(prisma.ticketReply.create).not.toHaveBeenCalled();
	});
});

describe("editReplyAction", () => {
	test("author can edit their own reply", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.ticketReply.findUnique).mockResolvedValue({
			authorId: STAFF_ID,
			ticketId: "t1",
		} as never);
		vi.mocked(prisma.ticketReply.update).mockResolvedValue({} as never);

		const result = await editReplyAction("r1", { bodyHtml: "<p>updated</p>" });

		expect(result).toEqual({ success: true });
		expect(prisma.ticketReply.update).toHaveBeenCalled();
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "TICKET_REPLY_UPDATED",
				actorId: STAFF_ID,
				targetType: "ticket_reply",
				targetId: "r1",
				metadata: { ticketId: "t1" },
			}),
		);
	});

	test("rejects edit from non-author", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.ticketReply.findUnique).mockResolvedValue({
			authorId: OTHER_STAFF_ID,
			ticketId: "t1",
		} as never);

		const result = await editReplyAction("r1", { bodyHtml: "<p>updated</p>" });

		expect(result).toEqual({
			success: false,
			error: "You can only edit your own replies",
		});
		expect(prisma.ticketReply.update).not.toHaveBeenCalled();
		expect(logActivityForRequest).not.toHaveBeenCalled();
	});
});

describe("deleteReplyAction", () => {
	test("author can delete their own reply", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.ticketReply.findUnique).mockResolvedValue({
			authorId: STAFF_ID,
			ticketId: "t1",
		} as never);
		vi.mocked(prisma.ticketReply.delete).mockResolvedValue({} as never);

		const result = await deleteReplyAction("r1");

		expect(result).toEqual({ success: true });
		expect(prisma.ticketReply.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
		expect(logActivityForRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "TICKET_REPLY_DELETED",
				actorId: STAFF_ID,
				targetType: "ticket_reply",
				targetId: "r1",
				metadata: { ticketId: "t1" },
			}),
		);
	});

	test("rejects delete from non-author (even if ADMIN)", async () => {
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(ADMIN_ID, "ADMIN") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
		vi.mocked(prisma.ticketReply.findUnique).mockResolvedValue({
			authorId: STAFF_ID,
			ticketId: "t1",
		} as never);

		const result = await deleteReplyAction("r1");

		expect(result).toEqual({
			success: false,
			error: "You can only delete your own replies",
		});
		expect(prisma.ticketReply.delete).not.toHaveBeenCalled();
		expect(logActivityForRequest).not.toHaveBeenCalled();
	});
});

describe("when Help Me module is disabled", () => {
	beforeEach(() => {
		vi.mocked(getHelpMeEnabled).mockResolvedValue(false);
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(STAFF_ID, "STAFF") as unknown as Awaited<ReturnType<typeof requireSession>>,
		);
	});

	test("createTicketAction rejects and does not write", async () => {
		const result = await createTicketAction(validInput());

		expect(result).toEqual({ success: false, error: "Help Me module is disabled" });
		expect(prisma.helpMeTicket.create).not.toHaveBeenCalled();
	});

	test("replyToTicketAction rejects and does not write", async () => {
		const result = await replyToTicketAction("t1", { bodyHtml: "<p>ok</p>" });

		expect(result).toEqual({ success: false, error: "Help Me module is disabled" });
		expect(prisma.ticketReply.create).not.toHaveBeenCalled();
	});

	test("editReplyAction rejects and does not write", async () => {
		const result = await editReplyAction("r1", { bodyHtml: "<p>ok</p>" });

		expect(result).toEqual({ success: false, error: "Help Me module is disabled" });
		expect(prisma.ticketReply.update).not.toHaveBeenCalled();
		expect(logActivityForRequest).not.toHaveBeenCalled();
	});

	test("deleteReplyAction rejects and does not delete", async () => {
		const result = await deleteReplyAction("r1");

		expect(result).toEqual({ success: false, error: "Help Me module is disabled" });
		expect(prisma.ticketReply.delete).not.toHaveBeenCalled();
		expect(logActivityForRequest).not.toHaveBeenCalled();
	});

	test("listTicketsForCurrentUser returns an empty list and does not query", async () => {
		const result = await listTicketsForCurrentUser();

		expect(result).toEqual({ tickets: [], isAdmin: false });
		expect(prisma.helpMeTicket.findMany).not.toHaveBeenCalled();
	});

	test("getTicketByIdForCurrentUser returns null and does not query", async () => {
		const result = await getTicketByIdForCurrentUser("t1");

		expect(result).toBeNull();
		expect(prisma.helpMeTicket.findFirst).not.toHaveBeenCalled();
	});
});
