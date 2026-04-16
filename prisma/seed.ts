import { prisma } from "../lib/db";
import { auth } from "../lib/auth";
import type { Branch, Role } from "../app/generated/prisma/client";

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
		branch: Branch;
		departmentId: string | null;
		position?: string;
	}> = [
		{
			email: "christian.diomampo@accessgroup.net.au",
			firstName: "Christian",
			lastName: "Diomampo",
			role: "SUPERADMIN",
			branch: "ISO",
			departmentId: departments[5].id,
		},
		{
			email: "alfred.irlanda@accessgroup.net.au",
			firstName: "Alfred",
			lastName: "Irlanda",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
		},
		{
			email: "kaye.mora@accessgroup.net.au",
			firstName: "Kaye",
			lastName: "Mora",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
		},
		{
			email: "tamer.abdelatty@accessgroup.net.au",
			firstName: "Tamer",
			lastName: "Abdelatty",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
		},
		{
			email: "aaron.alonzo@accessgroup.net.au",
			firstName: "Aaron Gabriel",
			lastName: "Alonzo",
			role: "STAFF",
			branch: "ISO",
			departmentId: departments[5].id,
		},
		{
			email: "grace.urmeneta@accessgroup.net.au",
			firstName: "Ace",
			lastName: "Urmeneta",
			role: "STAFF",
			branch: "ISO",
			departmentId: departments[5].id,
		},
		{
			email: "kate.bickley@accessgroup.net.au",
			firstName: "Kate",
			lastName: "Bickley",
			role: "ADMIN",
			branch: "PERTH",
			departmentId: departments[5].id,
			position: "CMO",
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
				branch: userData.branch,
				departmentId: userData.departmentId,
				position: userData.position ?? null,
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
		// Round 2
		{
			senderId: userByEmail("christian.diomampo@accessgroup.net.au"),
			recipientId: userByEmail("kaye.mora@accessgroup.net.au"),
			message:
				"Your effort in streamlining the leave approval process has saved the team so much time. Really appreciate the initiative.",
			date: new Date("2026-03-10"),
			valuesContinuousImprovement: true,
			valuesPeople: true,
		},
		{
			senderId: userByEmail("christian.diomampo@accessgroup.net.au"),
			recipientId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			message:
				"The social media strategy you proposed was spot on. Great research and execution across all channels.",
			date: new Date("2026-03-12"),
			valuesCommunication: true,
			valuesContinuousImprovement: true,
		},
		{
			senderId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			recipientId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			message:
				"Thanks for covering the compliance audit while the team was short-staffed. Your reliability is outstanding.",
			date: new Date("2026-03-11"),
			valuesRespect: true,
			valuesSafety: true,
		},
		{
			senderId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			recipientId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			message:
				"Your quick turnaround on the event brochures was impressive. The quality didn't slip despite the tight deadline.",
			date: new Date("2026-03-14"),
			valuesContinuousImprovement: true,
			valuesPeople: true,
		},
		{
			senderId: userByEmail("kaye.mora@accessgroup.net.au"),
			recipientId: userByEmail("christian.diomampo@accessgroup.net.au"),
			message:
				"Thank you for mentoring the new interns this month. They've already made great progress thanks to your guidance.",
			date: new Date("2026-03-16"),
			valuesPeople: true,
			valuesRespect: true,
		},
		{
			senderId: userByEmail("kaye.mora@accessgroup.net.au"),
			recipientId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			message:
				"Your thorough review of the policy documents caught several critical issues before they went out. Great attention to detail.",
			date: new Date("2026-03-19"),
			valuesSafety: true,
			valuesCommunication: true,
		},
		{
			senderId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			recipientId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			message:
				"The welcome kits you designed for new employees are fantastic. They really set the tone for a positive first day.",
			date: new Date("2026-03-21"),
			valuesPeople: true,
			valuesCommunication: true,
		},
		{
			senderId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			recipientId: userByEmail("christian.diomampo@accessgroup.net.au"),
			message:
				"Your dashboard reporting tool has made weekly reviews so much smoother. The whole team benefits from your work.",
			date: new Date("2026-03-24"),
			valuesContinuousImprovement: true,
			valuesCommunication: true,
		},
		{
			senderId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			recipientId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			message:
				"Thanks for organising the cross-department workshop. It really helped us understand HR processes better.",
			date: new Date("2026-03-17"),
			valuesCommunication: true,
			valuesRespect: true,
		},
		{
			senderId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			recipientId: userByEmail("kaye.mora@accessgroup.net.au"),
			message:
				"Your feedback on our marketing proposals was constructive and actionable. It made the final version so much stronger.",
			date: new Date("2026-03-26"),
			valuesRespect: true,
			valuesContinuousImprovement: true,
		},
		{
			senderId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			recipientId: userByEmail("christian.diomampo@accessgroup.net.au"),
			message:
				"Thank you for jumping in to fix the website issue over the weekend. Your dedication to the team is unmatched.",
			date: new Date("2026-03-23"),
			valuesPeople: true,
			valuesSafety: true,
		},
		{
			senderId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			recipientId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			message:
				"Great job coordinating the product photoshoot. Everything ran on time and the results look amazing.",
			date: new Date("2026-03-27"),
			valuesCommunication: true,
			valuesPeople: true,
		},
		// Kate Bickley — sent
		{
			senderId: userByEmail("kate.bickley@accessgroup.net.au"),
			recipientId: userByEmail("christian.diomampo@accessgroup.net.au"),
			message:
				"Your leadership on the brand refresh project has been outstanding. The new direction really captures who we are as a company.",
			date: new Date("2026-03-13"),
			valuesCommunication: true,
			valuesContinuousImprovement: true,
		},
		{
			senderId: userByEmail("kate.bickley@accessgroup.net.au"),
			recipientId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			message:
				"The Perth office launch campaign you put together exceeded all expectations. The reach and engagement numbers speak for themselves.",
			date: new Date("2026-03-19"),
			valuesPeople: true,
			valuesContinuousImprovement: true,
		},
		{
			senderId: userByEmail("kate.bickley@accessgroup.net.au"),
			recipientId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			message:
				"Your design work on the quarterly report was exceptional. It turned dry data into a compelling story for stakeholders.",
			date: new Date("2026-03-26"),
			valuesCommunication: true,
			valuesRespect: true,
		},
		// Kate Bickley — received
		{
			senderId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			recipientId: userByEmail("kate.bickley@accessgroup.net.au"),
			message:
				"Thank you for championing the cross-office collaboration initiative. It's already making a real difference between ISO and Perth teams.",
			date: new Date("2026-03-14"),
			valuesPeople: true,
			valuesRespect: true,
		},
		{
			senderId: userByEmail("kaye.mora@accessgroup.net.au"),
			recipientId: userByEmail("kate.bickley@accessgroup.net.au"),
			message:
				"Your presentation at the all-hands meeting was inspiring. You really brought the marketing vision to life for the whole company.",
			date: new Date("2026-03-21"),
			valuesCommunication: true,
			valuesPeople: true,
		},
		{
			senderId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			recipientId: userByEmail("kate.bickley@accessgroup.net.au"),
			message:
				"The new employee branding guidelines you rolled out are clear and practical. They've made onboarding materials so much more consistent.",
			date: new Date("2026-03-28"),
			valuesContinuousImprovement: true,
			valuesSafety: true,
		},
	];

	for (const card of recognitionCards) {
		await prisma.recognitionCard.create({ data: card });
	}

	console.log(`Created ${recognitionCards.length} recognition cards`);
	console.log("Seeding notifications...");

	await prisma.notification.deleteMany();

	const allCards = await prisma.recognitionCard.findMany({
		select: {
			id: true,
			recipientId: true,
			sender: { select: { firstName: true, lastName: true } },
		},
	});

	for (const card of allCards) {
		await prisma.notification.create({
			data: {
				userId: card.recipientId,
				type: "CARD_RECEIVED",
				message: `${card.sender.firstName} ${card.sender.lastName} sent you a recognition card`,
				cardId: card.id,
			},
		});
	}

	console.log(`Created ${allCards.length} notifications`);

	console.log("Seeding app settings...");
	await prisma.appSetting.upsert({
		where: { key: "top_recognized_limit" },
		update: {},
		create: { key: "top_recognized_limit", value: "10" },
	});
	console.log("Set top_recognized_limit = 10");

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
