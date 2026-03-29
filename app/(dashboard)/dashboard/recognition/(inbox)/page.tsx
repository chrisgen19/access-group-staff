import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { hasMinRole } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma/client";

export default async function RecognitionPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const userRole = (session.user.role as Role) ?? "STAFF";
	const isAdmin = hasMinRole(userRole, "ADMIN");

	redirect(isAdmin ? "/dashboard/recognition/all" : "/dashboard/recognition/received");
}
