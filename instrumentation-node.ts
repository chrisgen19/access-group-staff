import { runItStaffUserBackfillOnceOnStartup } from "@/lib/backfills/it-staff-users";
import { prisma } from "@/lib/db";

async function maybeRunProductionBackfills() {
	if (process.env.RUN_IT_STAFF_BACKFILL !== "true") {
		return;
	}

	console.log("RUN_IT_STAFF_BACKFILL=true detected. Starting IT staff startup backfill.");

	try {
		await runItStaffUserBackfillOnceOnStartup(console);
	} finally {
		await prisma.$disconnect();
	}
}

void maybeRunProductionBackfills();
