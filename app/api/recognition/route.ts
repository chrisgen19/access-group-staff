import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import { VALUE_KEY_MAP } from "@/lib/recognition";
import type { Prisma } from "@/app/generated/prisma/client";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		return Response.json(
			{ success: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	try {
		const filter = request.nextUrl.searchParams.get("filter");
		const userRole = getUserRole(session);
		const isAdmin = hasMinRole(userRole, "ADMIN");
		const paginated = request.nextUrl.searchParams.get("paginated") === "true";

		let where: Prisma.RecognitionCardWhereInput | undefined;

		if (filter === "received") {
			where = { recipientId: session.user.id };
		} else if (filter === "sent") {
			where = { senderId: session.user.id };
		} else if (filter === "department") {
			const departmentId = session.user.departmentId as
				| string
				| null
				| undefined;
			if (departmentId) {
				where = {
					recipient: { departmentId },
				};
			} else {
				where = { id: "none" };
			}
		} else if (!isAdmin) {
			where = { recipientId: session.user.id };
		}

		const include = {
			sender: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					position: true,
				},
			},
			recipient: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					position: true,
				},
			},
			_count: {
				select: { reactions: true, comments: true },
			},
		};

		const mapCounts = <T extends { _count: { reactions: number; comments: number }; senderId: string; recipientId: string }>(
			{ _count, ...card }: T,
		) => ({
			...card,
			// Only expose interaction counts to participants (sender/recipient/admin)
			interactionCounts:
				card.senderId === session.user.id ||
				card.recipientId === session.user.id ||
				isAdmin
					? _count
					: null,
		});

		const isExport = request.nextUrl.searchParams.get("export") === "true";

		if ((paginated || isExport) && !filter && isAdmin) {
			const search = request.nextUrl.searchParams.get("search")?.trim();
			const valuesParam = request.nextUrl.searchParams.get("values");
			const dateFrom = request.nextUrl.searchParams.get("dateFrom");
			const dateTo = request.nextUrl.searchParams.get("dateTo");

			const conditions: Prisma.RecognitionCardWhereInput[] = [];

			if (search) {
				conditions.push({
					OR: [
						{ sender: { firstName: { contains: search, mode: "insensitive" } } },
						{ sender: { lastName: { contains: search, mode: "insensitive" } } },
						{ recipient: { firstName: { contains: search, mode: "insensitive" } } },
						{ recipient: { lastName: { contains: search, mode: "insensitive" } } },
					],
				});
			}

			if (valuesParam) {
				const valueKeys = valuesParam.split(",").filter((k) => k in VALUE_KEY_MAP);
				for (const key of valueKeys) {
					conditions.push({ [VALUE_KEY_MAP[key]]: true });
				}
			}

			if (dateFrom) {
				conditions.push({ date: { gte: new Date(dateFrom) } });
			}

			if (dateTo) {
				conditions.push({ date: { lte: new Date(`${dateTo}T23:59:59.999Z`) } });
			}

			const filteredWhere: Prisma.RecognitionCardWhereInput = conditions.length > 0
				? { AND: conditions }
				: {};

			if (isExport) {
				const exportInclude = {
					sender: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							position: true,
							branch: true,
							department: { select: { name: true } },
						},
					},
					recipient: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							position: true,
							branch: true,
							department: { select: { name: true } },
						},
					},
				};

				const EXPORT_LIMIT = 10_000;
				const cards = await prisma.recognitionCard.findMany({
					where: filteredWhere,
					include: exportInclude,
					orderBy: { createdAt: "desc" },
					take: EXPORT_LIMIT,
				});

				return Response.json({ success: true, data: cards });
			}

			const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
			const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize")) || 20));

			const [cards, total] = await Promise.all([
				prisma.recognitionCard.findMany({
					where: filteredWhere,
					include,
					orderBy: { createdAt: "desc" },
					skip: (page - 1) * pageSize,
					take: pageSize,
				}),
				prisma.recognitionCard.count({ where: filteredWhere }),
			]);

			return Response.json({
				success: true,
				data: cards.map(mapCounts),
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			});
		}

		const cards = await prisma.recognitionCard.findMany({
			where,
			include,
			orderBy: { createdAt: "desc" },
			take: 50,
		});

		const cardIds = cards.map((c) => c.id);

		// Batch fetch per-emoji reaction counts + current user's reactions (2 queries, not N+1)
		const [reactionCounts, userReactions] = await Promise.all([
			prisma.cardReaction.groupBy({
				by: ["cardId", "emoji"],
				where: { cardId: { in: cardIds } },
				_count: true,
			}),
			prisma.cardReaction.findMany({
				where: { cardId: { in: cardIds }, userId: session.user.id },
				select: { cardId: true, emoji: true },
			}),
		]);

		const userReactionSet = new Set(
			userReactions.map((r) => `${r.cardId}:${r.emoji}`),
		);

		const reactionsByCard = new Map<
			string,
			{ emoji: string; count: number; hasReacted: boolean }[]
		>();
		for (const rc of reactionCounts) {
			if (!reactionsByCard.has(rc.cardId)) {
				reactionsByCard.set(rc.cardId, []);
			}
			reactionsByCard.get(rc.cardId)!.push({
				emoji: rc.emoji,
				count: rc._count,
				hasReacted: userReactionSet.has(`${rc.cardId}:${rc.emoji}`),
			});
		}

		return Response.json({
			success: true,
			data: cards.map((card) => {
				const mapped = mapCounts(card);
				const isCardParticipant =
					card.senderId === session.user.id ||
					card.recipientId === session.user.id ||
					isAdmin;
				return {
					...mapped,
					reactionSummary: isCardParticipant
						? reactionsByCard.get(card.id) ?? []
						: undefined,
				};
			}),
		});
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
