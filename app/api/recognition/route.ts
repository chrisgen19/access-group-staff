import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";
import type { Prisma, Role } from "@/app/generated/prisma/client";
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
		const isAdmin = hasMinRole((session.user.role as Role) ?? "STAFF", "ADMIN");
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
					OR: [
						{ sender: { departmentId } },
						{ recipient: { departmentId } },
					],
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
		};

		if (paginated && !filter && isAdmin) {
			const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
			const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize")) || 20));

			const [cards, total] = await Promise.all([
				prisma.recognitionCard.findMany({
					where,
					include,
					orderBy: { createdAt: "desc" },
					skip: (page - 1) * pageSize,
					take: pageSize,
				}),
				prisma.recognitionCard.count({ where }),
			]);

			return Response.json({
				success: true,
				data: cards,
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

		return Response.json({ success: true, data: cards });
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
