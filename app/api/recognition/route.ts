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

		let where: Prisma.RecognitionCardWhereInput | undefined;
		const isAdmin = hasMinRole((session.user.role as Role) ?? "STAFF", "ADMIN");
		const unlimitedParam = request.nextUrl.searchParams.get("limit") === "none";
		const unlimited = !filter && isAdmin && unlimitedParam;

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

		const cards = await prisma.recognitionCard.findMany({
			where,
			include: {
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
			},
			orderBy: { createdAt: "desc" },
			...(unlimited ? {} : { take: 50 }),
		});

		return Response.json({ success: true, data: cards });
	} catch {
		return Response.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
