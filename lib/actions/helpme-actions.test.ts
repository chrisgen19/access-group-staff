import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		helpMeTicket: {
			create: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
	},
}));

import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
	createTicketAction,
	getTicketByIdForCurrentUser,
	listTicketsForCurrentUser,
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
