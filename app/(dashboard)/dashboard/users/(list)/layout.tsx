import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";
import { UsersTabs } from "../_components/users-tabs";

export default async function UsersListLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session || !canViewUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const [activeCount, deletedCount] = await Promise.all([
		prisma.user.count({ where: { deletedAt: null } }),
		prisma.user.count({ where: { deletedAt: { not: null } } }),
	]);

	return (
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
			<UsersTabs activeCount={activeCount} deletedCount={deletedCount} />
			{children}
		</div>
	);
}
