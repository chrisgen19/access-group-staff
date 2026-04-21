import { runItStaffUserBackfillOnceOnStartup } from "@/lib/backfills/it-staff-users";
import { prisma } from "@/lib/db";

export async function maybeRunProductionBackfills(
	logger: Pick<typeof console, "log" | "error"> = console,
) {
	if (process.env.RUN_IT_STAFF_BACKFILL !== "true") {
		return;
	}

	logger.log("RUN_IT_STAFF_BACKFILL=true detected. Starting IT staff startup backfill.");

	try {
		await runItStaffUserBackfillOnceOnStartup(logger);
	} catch (error) {
		logger.error("IT staff startup backfill failed. Continuing server startup.", error);
	} finally {
		await prisma.$disconnect();
	}
}

if (process.env.NODE_ENV !== "test") {
	void maybeRunProductionBackfills();
}
