import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
	try {
		await requireSession();
	} catch {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	try {
		const users = await prisma.user.findMany({
			where: { deletedAt: null },
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
		return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
