import { prisma } from "../lib/db";
import { auth } from "../lib/auth";
import type { Role } from "../app/generated/prisma/client";

const PASSWORD = "Password123!";

async function seed() {
	console.log("Seeding departments...");

	const departments = await Promise.all([
		prisma.department.upsert({
			where: { code: "ENG" },
			update: {},
			create: { name: "Engineering", code: "ENG" },
		}),
		prisma.department.upsert({
			where: { code: "HR" },
			update: {},
			create: { name: "Human Resources", code: "HR" },
		}),
		prisma.department.upsert({
			where: { code: "OPS" },
			update: {},
			create: { name: "Operations", code: "OPS" },
		}),
		prisma.department.upsert({
			where: { code: "FIN" },
			update: {},
			create: { name: "Finance", code: "FIN" },
		}),
		prisma.department.upsert({
			where: { code: "SAF" },
			update: {},
			create: { name: "Safety", code: "SAF" },
		}),
	]);

	console.log(`Created ${departments.length} departments`);
	console.log("Seeding users...");

	const users: Array<{
		email: string;
		firstName: string;
		lastName: string;
		role: Role;
		departmentId: string | null;
	}> = [
		{
			email: "christian.diomampo@accessgroup.net.au",
			firstName: "Christian",
			lastName: "Diomampo",
			role: "SUPERADMIN",
			departmentId: null,
		},
		{
			email: "jane.smith@accessgroup.net.au",
			firstName: "Jane",
			lastName: "Smith",
			role: "ADMIN",
			departmentId: departments[0].id,
		},
		{
			email: "john.doe@accessgroup.net.au",
			firstName: "John",
			lastName: "Doe",
			role: "STAFF",
			departmentId: departments[2].id,
		},
		{
			email: "sarah.jones@accessgroup.net.au",
			firstName: "Sarah",
			lastName: "Jones",
			role: "STAFF",
			departmentId: departments[3].id,
		},
	];

	for (const userData of users) {
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
				role: userData.role,
				departmentId: userData.departmentId,
				isActive: true,
			},
		});

		console.log(`Created user: ${userData.email} (${userData.role})`);
	}

	console.log("Seed complete!");
}

seed()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
