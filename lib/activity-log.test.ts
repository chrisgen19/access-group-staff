import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
	env: { TRUST_PROXY_HEADERS: false },
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		activityLog: { create: vi.fn() },
	},
}));

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "./activity-log";

function p2002Error(): Prisma.PrismaClientKnownRequestError {
	return new Prisma.PrismaClientKnownRequestError(
		"Unique constraint failed on (actor_id, visit_day_utc)",
		{
			code: "P2002",
			clientVersion: "test",
			meta: { target: ["actor_id", "visit_day_utc"] },
		},
	);
}

const FROZEN_NOW = new Date("2026-04-21T12:34:56.000Z");
const FROZEN_DAY_UTC = "2026-04-21T00:00:00.000Z";

describe("logActivity", () => {
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(FROZEN_NOW);
		errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		errorSpy.mockRestore();
		vi.useRealTimers();
	});

	test("USER_VISITED writes populate visitDayUtc with UTC midnight", async () => {
		vi.mocked(prisma.activityLog.create).mockResolvedValue({} as never);

		await logActivity({ action: "USER_VISITED", actorId: "user_1" });

		const arg = vi.mocked(prisma.activityLog.create).mock.calls[0][0];
		const visitDayUtc = arg.data.visitDayUtc as Date;
		expect(visitDayUtc.toISOString()).toBe(FROZEN_DAY_UTC);
	});

	test("non-USER_VISITED writes leave visitDayUtc null", async () => {
		vi.mocked(prisma.activityLog.create).mockResolvedValue({} as never);

		await logActivity({ action: "USER_SIGNED_IN", actorId: "user_1" });

		const arg = vi.mocked(prisma.activityLog.create).mock.calls[0][0];
		expect(arg.data.visitDayUtc).toBeNull();
	});

	test("P2002 on USER_VISITED is silently swallowed", async () => {
		vi.mocked(prisma.activityLog.create).mockRejectedValue(p2002Error());

		await expect(
			logActivity({ action: "USER_VISITED", actorId: "user_1" }),
		).resolves.toBeUndefined();
		expect(errorSpy).not.toHaveBeenCalled();
	});

	test("P2002 on a non-USER_VISITED action is still logged as an error", async () => {
		vi.mocked(prisma.activityLog.create).mockRejectedValue(p2002Error());

		await logActivity({ action: "USER_SIGNED_IN", actorId: "user_1" });

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith(
			"activity-log write failed",
			expect.objectContaining({ action: "USER_SIGNED_IN" }),
		);
	});

	test("non-P2002 errors on USER_VISITED are logged, not swallowed", async () => {
		const otherErr = new Prisma.PrismaClientKnownRequestError("connection reset", {
			code: "P1001",
			clientVersion: "test",
		});
		vi.mocked(prisma.activityLog.create).mockRejectedValue(otherErr);

		await logActivity({ action: "USER_VISITED", actorId: "user_1" });

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith(
			"activity-log write failed",
			expect.objectContaining({ action: "USER_VISITED" }),
		);
	});
});
