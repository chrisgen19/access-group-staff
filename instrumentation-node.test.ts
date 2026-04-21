import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/backfills/it-staff-users", () => ({
	runItStaffUserBackfillOnceOnStartup: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		$disconnect: vi.fn(),
	},
}));

import { runItStaffUserBackfillOnceOnStartup } from "@/lib/backfills/it-staff-users";
import { prisma } from "@/lib/db";
import { maybeRunProductionBackfills } from "./instrumentation-node";

beforeEach(() => {
	vi.clearAllMocks();
	delete process.env.RUN_IT_STAFF_BACKFILL;
});

describe("maybeRunProductionBackfills", () => {
	test("skips when the startup flag is not enabled", async () => {
		await maybeRunProductionBackfills(console);

		expect(runItStaffUserBackfillOnceOnStartup).not.toHaveBeenCalled();
		expect(prisma.$disconnect).not.toHaveBeenCalled();
	});

	test("logs and continues startup when the backfill throws", async () => {
		process.env.RUN_IT_STAFF_BACKFILL = "true";
		const logger = {
			log: vi.fn(),
			error: vi.fn(),
		};
		vi.mocked(runItStaffUserBackfillOnceOnStartup).mockRejectedValueOnce(new Error("boom"));

		await expect(maybeRunProductionBackfills(logger)).resolves.toBeUndefined();

		expect(logger.error).toHaveBeenCalledWith(
			"IT staff startup backfill failed. Continuing server startup.",
			expect.any(Error),
		);
		expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
	});
});
