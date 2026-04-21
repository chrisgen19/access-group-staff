import { prisma } from "../lib/db";

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

const shouldApply = process.argv.includes("--apply");

async function backfillItStaffUsers() {
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
				position: true,
				role: true,
				departmentId: true,
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

	console.log(shouldApply ? "Applying IT staff backfill." : "Dry run only. No changes applied.");
	console.log(`Matched users: ${matchedUsers.length}`);
	for (const user of matchedUsers) {
		const line = `${user.name} <${user.email}> -> ${user.position} / STAFF / IT`;
		console.log(`- ${line}`);
	}

	console.log(`Missing users: ${missing.length}`);
	for (const line of missing) {
		console.log(`- ${line}`);
	}

	if (shouldApply && missing.length > 0) {
		throw new Error(
			"Aborting apply because one or more users from the backfill list were not found.",
		);
	}

	if (shouldApply) {
		for (const user of matchedUsers) {
			await prisma.user.update({
				where: { id: user.id },
				data: {
					position: user.position,
					role: "STAFF",
					departmentId: itDepartment.id,
				},
			});
		}

		console.log("Backfill applied successfully.");
	}

	if (!shouldApply) {
		console.log("Re-run with --apply to persist these updates.");
	}
}

backfillItStaffUsers()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
