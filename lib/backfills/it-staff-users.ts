import { prisma } from "@/lib/db";

const IT_STAFF_UPDATES = [
	{
		email: "abdul.solaiman@accessgroup.net.au",
		name: "Abdul Moiz Solaiman",
		position: "Frontend Engineer",
	},
	{
		email: "chrizza.trinidad@accessgroup.net.au",
		name: "Chrizza Ann Trinidad",
		position: "Business Intelligence Analyst",
	},
	{
		email: "cristian.cabacaba@accessgroup.net.au",
		name: "Cristian Cabacaba",
		position: "Lead NetSuite Technical Consultant",
	},
	{
		email: "cristina.delima@accessgroup.net.au",
		name: "Cristina De Lima",
		position: "Web Developer",
	},
	{
		email: "jaypee.cruz@accessgroup.net.au",
		name: "Jaypee Cruz",
		position: "Business Intelligence Analyst",
	},
	{
		email: "jehnsen.enrique@accessgroup.net.au",
		name: "Jehnsen Enrique",
		position: "Integration Developer",
	},
	{
		email: "jeorgee.vergara@accessgroup.net.au",
		name: "Jeorgee Vergara",
		position: "NetSuite Technical Consultant",
	},
	{
		email: "jonathan.taruc@accessgroup.net.au",
		name: "Jonathan Ray Taruc",
		position: "Business Intelligence Analyst",
	},
	{
		email: "lester.agustin@accessgroup.net.au",
		name: "Lester Agustin",
		position: "NetSuite Technical Consultant",
	},
	{
		email: "mil.pajares@accessgroup.net.au",
		name: "Mil Alran Pajares",
		position: "NetSuite Technical Consultant",
	},
	{
		email: "raymond.ricarte@accessgroup.net.au",
		name: "Raymond Ricarte",
		position: "Business Intelligence Analyst Lead",
	},
	{
		email: "rob.cristobal@accessgroup.net.au",
		name: "Robin Ray Cristobal",
		position: "Reports and Analytics Lead",
	},
] as const;

const BACKFILL_MARKER_KEY = "backfill.it_staff_users.completed_at";
const ADVISORY_LOCK_KEY = 130001;

type Logger = Pick<typeof console, "log" | "error">;

type BackfillOptions = {
	apply: boolean;
	logger?: Logger;
};

export async function runItStaffUserBackfill({ apply, logger = console }: BackfillOptions) {
	const itDepartment = await prisma.department.findUnique({
		where: { code: "IT" },
	});

	if (!itDepartment) {
		throw new Error("IT department not found. Seed or reconcile departments first.");
	}

	const matchedUsers: Array<{
		id: string;
		email: string;
		name: string;
		position: string;
	}> = [];
	const missing: string[] = [];

	for (const staffUser of IT_STAFF_UPDATES) {
		const email = staffUser.email.toLowerCase();
		const existingUser = await prisma.user.findFirst({
			where: {
				email: {
					equals: email,
					mode: "insensitive",
				},
			},
			select: {
				id: true,
				email: true,
			},
		});

		if (!existingUser) {
			missing.push(`${staffUser.name} <${email}>`);
			continue;
		}

		matchedUsers.push({
			id: existingUser.id,
			email: existingUser.email,
			name: staffUser.name,
			position: staffUser.position,
		});
	}

	logger.log(apply ? "Applying IT staff backfill." : "Dry run only. No changes applied.");
	logger.log(`Matched users: ${matchedUsers.length}`);
	for (const user of matchedUsers) {
		logger.log(`- ${user.name} <${user.email}> -> ${user.position} / STAFF / IT`);
	}

	logger.log(`Missing users: ${missing.length}`);
	for (const line of missing) {
		logger.log(`- ${line}`);
	}

	if (!apply) {
		logger.log("Re-run with --apply to persist these updates.");
		return { updated: 0, matched: matchedUsers.length, missing };
	}

	if (matchedUsers.length === 0) {
		throw new Error("Aborting apply because none of the backfill users were found.");
	}

	await prisma.$transaction(
		matchedUsers.map((user) =>
			prisma.user.update({
				where: { id: user.id },
				data: {
					position: user.position,
					role: "STAFF",
					departmentId: itDepartment.id,
				},
			}),
		),
	);

	logger.log("Backfill applied successfully.");
	if (missing.length > 0) {
		logger.log("Skipped missing users. They can be backfilled later after registration.");
	}
	return { updated: matchedUsers.length, matched: matchedUsers.length, missing };
}

export async function runItStaffUserBackfillOnceOnStartup(logger: Logger = console) {
	const marker = await prisma.appSetting.findUnique({
		where: { key: BACKFILL_MARKER_KEY },
	});
	if (marker) {
		logger.log("IT staff backfill already completed. Skipping startup backfill.");
		return { skipped: true, reason: "already_completed" } as const;
	}

	const lockRows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
		SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY}) AS locked
	`;
	const hasLock = lockRows[0]?.locked === true;

	if (!hasLock) {
		logger.log("IT staff backfill lock is already held by another instance. Skipping.");
		return { skipped: true, reason: "lock_unavailable" } as const;
	}

	try {
		const freshMarker = await prisma.appSetting.findUnique({
			where: { key: BACKFILL_MARKER_KEY },
		});
		if (freshMarker) {
			logger.log("IT staff backfill already completed after lock acquisition. Skipping.");
			return { skipped: true, reason: "already_completed" } as const;
		}

		const result = await runItStaffUserBackfill({ apply: true, logger });

		await prisma.appSetting.upsert({
			where: { key: BACKFILL_MARKER_KEY },
			update: { value: new Date().toISOString() },
			create: {
				key: BACKFILL_MARKER_KEY,
				value: new Date().toISOString(),
			},
		});

		logger.log("IT staff backfill completion marker saved.");
		return { skipped: false, ...result } as const;
	} finally {
		await prisma.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`;
	}
}
