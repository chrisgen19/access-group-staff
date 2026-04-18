import { auth } from "../lib/auth";
import { prisma } from "../lib/db";

const PASSWORD = "Password123!";

async function insertHrAdmins() {
	const hrDepartment = await prisma.department.findUnique({
		where: { code: "HR" },
	});

	if (!hrDepartment) {
		console.error("HR department not found. Run the seed first.");
		process.exit(1);
	}

	// Users to update (already exist)
	const usersToUpdate = [
		{
			email: "alfred.irlanda@accessgroup.net.au",
			firstName: "Alfred Niel",
			lastName: "Irlanda",
			position: "HR Compliance Coordinator",
		},
		{
			email: "kaye.mora@accessgroup.net.au",
			firstName: "Karen Mae",
			lastName: "Mora",
			position: "Office Manager",
		},
	];

	// New users to create
	const usersToCreate = [
		{
			email: "may.viduya@accessgroup.net.au",
			firstName: "May Joy",
			lastName: "Viduya",
			position: "HR Systems Administrator",
		},
		{
			email: "nadine.hortal@accessgroup.net.au",
			firstName: "Nadine Frances",
			lastName: "Hortal",
			position: "Recruitment and Onboarding Admin",
		},
		{
			email: "rona.raymundo@accessgroup.net.au",
			firstName: "Rona Mae",
			lastName: "Raymundo",
			position: "Offshore Sourcing Specialist",
		},
	];

	// Update existing users
	for (const userData of usersToUpdate) {
		const existing = await prisma.user.findFirst({
			where: { email: userData.email },
		});

		if (!existing) {
			console.log(`User ${userData.email} not found, skipping update.`);
			continue;
		}

		await prisma.user.update({
			where: { id: existing.id },
			data: {
				firstName: userData.firstName,
				lastName: userData.lastName,
				name: `${userData.firstName} ${userData.lastName}`,
				position: userData.position,
			},
		});

		console.log(`Updated user: ${userData.email}`);
	}

	// Create new users
	for (const userData of usersToCreate) {
		const existing = await prisma.user.findFirst({
			where: { email: userData.email },
		});

		if (existing) {
			console.log(`User ${userData.email} already exists, skipping.`);
			continue;
		}

		const result = await auth.api.signUpEmail({
			body: {
				email: userData.email,
				password: PASSWORD,
				name: `${userData.firstName} ${userData.lastName}`,
				firstName: userData.firstName,
				lastName: userData.lastName,
			},
		});

		if (!result.user) {
			console.error(`Failed to create user: ${userData.email}`);
			continue;
		}

		await prisma.user.update({
			where: { id: result.user.id },
			data: {
				role: "ADMIN",
				branch: "ISO",
				departmentId: hrDepartment.id,
				position: userData.position,
				isActive: true,
			},
		});

		console.log(`Created user: ${userData.email} (ADMIN)`);
	}

	console.log("Done!");
}

insertHrAdmins()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
