import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
	try {
		await requireSession();

		const users = await prisma.user.findMany({
			where: { isActive: true },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				position: true,
				department: { select: { name: true } },
			},
			orderBy: { firstName: "asc" },
		});

		return Response.json({ success: true, data: users });
	} catch {
		return Response.json(
			{ success: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}
}
