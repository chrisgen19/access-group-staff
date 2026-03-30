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
		prisma.department.upsert({
			where: { code: "MKT" },
			update: {},
			create: { name: "Marketing", code: "MKT" },
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
			departmentId: departments[5].id,
		},
		{
			email: "alfred.irlanda@accessgroup.net.au",
			firstName: "Alfred",
			lastName: "Irlanda",
			role: "ADMIN",
			departmentId: departments[1].id,
		},
		{
			email: "kaye.mora@accessgroup.net.au",
			firstName: "Kaye",
			lastName: "Mora",
			role: "ADMIN",
			departmentId: departments[1].id,
		},
		{
			email: "tamer.abdelatty@accessgroup.net.au",
			firstName: "Tamer",
			lastName: "Abdelatty",
			role: "ADMIN",
			departmentId: departments[1].id,
		},
		{
			email: "aaron.alonzo@accessgroup.net.au",
			firstName: "Aaron Gabriel",
			lastName: "Alonzo",
			role: "STAFF",
			departmentId: departments[5].id,
		},
		{
			email: "grace.urmeneta@accessgroup.net.au",
			firstName: "Ace",
			lastName: "Urmeneta",
			role: "STAFF",
			departmentId: departments[5].id,
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

	console.log("Seeding recognition cards...");

	const allUsers = await prisma.user.findMany({
		select: { id: true, email: true },
	});

	const userByEmail = (email: string) => {
		const user = allUsers.find((u) => u.email === email);
		if (!user) throw new Error(`User not found: ${email}`);
		return user.id;
	};

	const recognitionCards = [
		{
			senderId: userByEmail("christian.diomampo@accessgroup.net.au"),
			recipientId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			message:
				"Thank you for leading the onboarding improvements this quarter. Your dedication to making new hires feel welcome has been incredible.",
			date: new Date("2026-03-15"),
			valuesPeople: true,
			valuesCommunication: true,
		},
		{
			senderId: userByEmail("kaye.mora@accessgroup.net.au"),
			recipientId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			message:
				"Great work on the safety training materials for the marketing team. You went above and beyond to make them engaging and easy to follow.",
			date: new Date("2026-03-18"),
			valuesSafety: true,
			valuesContinuousImprovement: true,
		},
		{
			senderId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			recipientId: userByEmail("christian.diomampo@accessgroup.net.au"),
			message:
				"Thanks for staying late to help resolve the production issue. Your calm approach under pressure kept the whole team focused.",
			date: new Date("2026-03-20"),
			valuesRespect: true,
			valuesPeople: true,
		},
		{
			senderId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			recipientId: userByEmail("kaye.mora@accessgroup.net.au"),
			message:
				"Your presentation on the new HR policies was clear and well-structured. Everyone left the meeting with a solid understanding of the changes.",
			date: new Date("2026-03-22"),
			valuesCommunication: true,
		},
		{
			senderId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			recipientId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			message:
				"Amazing job on the campaign launch! Your creative ideas and attention to detail really made it stand out.",
			date: new Date("2026-03-25"),
			valuesContinuousImprovement: true,
			valuesPeople: true,
		},
		{
			senderId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			recipientId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			message:
				"Thank you for always being available to answer questions and support the team. Your patience and willingness to help is truly appreciated.",
			date: new Date("2026-03-28"),
			valuesRespect: true,
			valuesCommunication: true,
			valuesPeople: true,
		},
	];

	for (const card of recognitionCards) {
		await prisma.recognitionCard.create({ data: card });
	}

	console.log(`Created ${recognitionCards.length} recognition cards`);
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
