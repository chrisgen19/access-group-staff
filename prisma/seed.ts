import type { Branch, Role } from "../app/generated/prisma/client";
import { auth } from "../lib/auth";
import { prisma } from "../lib/db";

const PASSWORD = "Password123!";

type SeededCard = {
	id: string;
	senderId: string;
	recipientId: string;
	message: string;
	date: Date;
	valuesPeople?: boolean;
	valuesSafety?: boolean;
	valuesRespect?: boolean;
	valuesCommunication?: boolean;
	valuesContinuousImprovement?: boolean;
};

type SeededReaction = {
	cardId: string;
	userId: string;
	emoji: string;
	createdAt: Date;
};

type SeededComment = {
	cardId: string;
	userId: string;
	body: string;
	createdAt: Date;
};

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
			firstName: "Alfred Niel",
			lastName: "Irlanda",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
			position: "HR Compliance Coordinator",
		},
		{
			email: "kaye.mora@accessgroup.net.au",
			firstName: "Karen Mae",
			lastName: "Mora",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
			position: "Office Manager",
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
			email: "may.viduya@accessgroup.net.au",
			firstName: "May Joy",
			lastName: "Viduya",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
			position: "HR Systems Administrator",
		},
		{
			email: "nadine.hortal@accessgroup.net.au",
			firstName: "Nadine Frances",
			lastName: "Hortal",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
			position: "Recruitment and Onboarding Admin",
		},
		{
			email: "rona.raymundo@accessgroup.net.au",
			firstName: "Rona Mae",
			lastName: "Raymundo",
			role: "ADMIN",
			branch: "ISO",
			departmentId: departments[1].id,
			position: "Offshore Sourcing Specialist",
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

	console.log("Seeding recent interaction showcase cards...");

	const showcaseCards: SeededCard[] = [
		{
			id: "showcase-popover-card-1",
			senderId: userByEmail("christian.diomampo@accessgroup.net.au"),
			recipientId: userByEmail("kate.bickley@accessgroup.net.au"),
			message:
				"Recent showcase: thank you for driving the quarterly planning workshop and making every team feel represented in the final roadmap.",
			date: new Date("2026-04-19"),
			valuesPeople: true,
			valuesCommunication: true,
			valuesContinuousImprovement: true,
		},
		{
			id: "showcase-popover-card-2",
			senderId: userByEmail("kate.bickley@accessgroup.net.au"),
			recipientId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			message:
				"Recent showcase: your launch support pack was polished, practical, and exactly what the field teams needed this week.",
			date: new Date("2026-04-20"),
			valuesCommunication: true,
			valuesRespect: true,
		},
		{
			id: "showcase-popover-card-3",
			senderId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			recipientId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			message:
				"Recent showcase: the onboarding collateral refresh made the process clearer for new starters and reduced repeat questions for the team.",
			date: new Date("2026-04-21"),
			valuesPeople: true,
			valuesContinuousImprovement: true,
		},
	];

	for (const card of showcaseCards) {
		await prisma.recognitionCard.upsert({
			where: { id: card.id },
			update: {
				senderId: card.senderId,
				recipientId: card.recipientId,
				message: card.message,
				date: card.date,
				valuesPeople: card.valuesPeople ?? false,
				valuesSafety: card.valuesSafety ?? false,
				valuesRespect: card.valuesRespect ?? false,
				valuesCommunication: card.valuesCommunication ?? false,
				valuesContinuousImprovement: card.valuesContinuousImprovement ?? false,
			},
			create: card,
		});
	}

	const showcaseCardIds = showcaseCards.map((card) => card.id);
	await prisma.cardReaction.deleteMany({ where: { cardId: { in: showcaseCardIds } } });
	await prisma.cardComment.deleteMany({ where: { cardId: { in: showcaseCardIds } } });

	const showcaseReactions: SeededReaction[] = [
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:00:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("kaye.mora@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:05:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:10:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("may.viduya@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:15:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("nadine.hortal@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:20:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("rona.raymundo@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:25:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:30:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:35:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("kate.bickley@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T08:40:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			emoji: "🎉",
			createdAt: new Date("2026-04-21T08:45:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("may.viduya@accessgroup.net.au"),
			emoji: "🎉",
			createdAt: new Date("2026-04-21T08:50:00Z"),
		},
		{
			cardId: "showcase-popover-card-2",
			userId: userByEmail("christian.diomampo@accessgroup.net.au"),
			emoji: "🔥",
			createdAt: new Date("2026-04-21T09:00:00Z"),
		},
		{
			cardId: "showcase-popover-card-2",
			userId: userByEmail("grace.urmeneta@accessgroup.net.au"),
			emoji: "🔥",
			createdAt: new Date("2026-04-21T09:05:00Z"),
		},
		{
			cardId: "showcase-popover-card-2",
			userId: userByEmail("tamer.abdelatty@accessgroup.net.au"),
			emoji: "❤️",
			createdAt: new Date("2026-04-21T09:10:00Z"),
		},
		{
			cardId: "showcase-popover-card-2",
			userId: userByEmail("kaye.mora@accessgroup.net.au"),
			emoji: "💪",
			createdAt: new Date("2026-04-21T09:15:00Z"),
		},
		{
			cardId: "showcase-popover-card-3",
			userId: userByEmail("christian.diomampo@accessgroup.net.au"),
			emoji: "😊",
			createdAt: new Date("2026-04-21T09:20:00Z"),
		},
		{
			cardId: "showcase-popover-card-3",
			userId: userByEmail("aaron.alonzo@accessgroup.net.au"),
			emoji: "😊",
			createdAt: new Date("2026-04-21T09:25:00Z"),
		},
		{
			cardId: "showcase-popover-card-3",
			userId: userByEmail("kate.bickley@accessgroup.net.au"),
			emoji: "👏",
			createdAt: new Date("2026-04-21T09:30:00Z"),
		},
	];

	for (const reaction of showcaseReactions) {
		await prisma.cardReaction.create({ data: reaction });
	}

	const showcaseComments: SeededComment[] = [
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("alfred.irlanda@accessgroup.net.au"),
			body: "The workshop notes were excellent. Every action item was clear and easy to follow.",
			createdAt: new Date("2026-04-21T10:00:00Z"),
		},
		{
			cardId: "showcase-popover-card-1",
			userId: userByEmail("kaye.mora@accessgroup.net.au"),
			body: "This is the exact kind of cross-team planning we need more of.",
			createdAt: new Date("2026-04-21T10:05:00Z"),
		},
		{
			cardId: "showcase-popover-card-2",
			userId: userByEmail("christian.diomampo@accessgroup.net.au"),
			body: "The pack looked great on desktop and mobile. Nice balance between polish and clarity.",
			createdAt: new Date("2026-04-21T10:10:00Z"),
		},
	];

	for (const comment of showcaseComments) {
		await prisma.cardComment.create({ data: comment });
	}

	console.log(
		`Seeded ${showcaseCards.length} showcase cards, ${showcaseReactions.length} reactions, and ${showcaseComments.length} comments`,
	);
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
