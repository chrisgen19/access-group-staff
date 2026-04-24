import type { NextRequest } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import { VALUE_KEY_MAP } from "@/lib/recognition";

export async function GET(request: NextRequest) {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
			const departmentId = session.user.departmentId as string | null | undefined;
			if (departmentId) {
				where = {
					recipient: { departmentId },
				};
			} else {
				where = { id: "none" };
			}
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

		const mapCounts = <T extends { _count: { reactions: number; comments: number } }>({
			_count,
			...card
		}: T) => ({
			...card,
			interactionCounts: _count,
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

			const filteredWhere: Prisma.RecognitionCardWhereInput =
				conditions.length > 0 ? { AND: conditions } : {};

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
			const pageSize = Math.min(
				100,
				Math.max(1, Number(request.nextUrl.searchParams.get("pageSize")) || 20),
			);

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

		const limitParam = Number(request.nextUrl.searchParams.get("limit"));
		const limit = Math.min(
			50,
			Math.max(1, Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50),
		);
		const cursor = request.nextUrl.searchParams.get("cursor") || undefined;

		const rows = await prisma.recognitionCard.findMany({
			where,
			include,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: limit + 1,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		});

		const hasMore = rows.length > limit;
		const cards = hasMore ? rows.slice(0, limit) : rows;
		const nextCursor = hasMore ? (cards[cards.length - 1]?.id ?? null) : null;

		const cardIds = cards.map((c) => c.id);

		// Single pass — fetch every reaction row with the reactor's public fields.
		// Bounded per card (≤ 6 emojis × N participants), so joining the user is cheap
		// and lets the ReactorPopover render on first paint without waiting for the lazy fetch.
		const allReactions = await prisma.cardReaction.findMany({
			where: { cardId: { in: cardIds } },
			select: {
				cardId: true,
				emoji: true,
				userId: true,
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						avatar: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		type ReactorEntry = {
			emoji: string;
			count: number;
			hasReacted: boolean;
			users: { id: string; firstName: string; lastName: string; avatar: string | null }[];
		};
		const reactionsByCard = new Map<string, Map<string, ReactorEntry>>();
		for (const r of allReactions) {
			let perCard = reactionsByCard.get(r.cardId);
			if (!perCard) {
				perCard = new Map();
				reactionsByCard.set(r.cardId, perCard);
			}
			let entry = perCard.get(r.emoji);
			if (!entry) {
				entry = { emoji: r.emoji, count: 0, hasReacted: false, users: [] };
				perCard.set(r.emoji, entry);
			}
			entry.count += 1;
			entry.users.push(r.user);
			if (r.userId === session.user.id) entry.hasReacted = true;
		}

		return Response.json({
			success: true,
			data: cards.map((card) => ({
				...mapCounts(card),
				reactionSummary: Array.from(reactionsByCard.get(card.id)?.values() ?? []),
			})),
			nextCursor,
		});
	} catch {
		return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
