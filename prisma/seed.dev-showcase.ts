import { prisma } from "../lib/db";

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

async function seedShowcase() {
	const allUsers = await prisma.user.findMany({
		select: { id: true, email: true },
	});

	const userByEmail = (email: string) => {
		const user = allUsers.find((u) => u.email === email);
		if (!user) throw new Error(`User not found: ${email}. Run the main seed first.`);
		return user.id;
	};

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
}

seedShowcase()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
