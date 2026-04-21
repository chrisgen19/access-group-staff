import { runItStaffUserBackfill } from "../lib/backfills/it-staff-users";
import { prisma } from "../lib/db";

const shouldApply = process.argv.includes("--apply");

runItStaffUserBackfill({ apply: shouldApply })
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
