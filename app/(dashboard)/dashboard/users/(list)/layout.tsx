import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canManageUsers, canViewUsers } from "@/lib/permissions";
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

	const canAdd = canManageUsers(session.user.role as Role);

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<DashboardPageHeader
				eyebrow="Staff"
				title="Staff Directory"
				description="Manage staff accounts, roles, and department assignments."
				actions={
					canAdd ? (
						<Link
							href="/dashboard/users/new"
							className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30"
						>
							<Plus className="-ml-1 h-5 w-5" />
							Add Staff Member
						</Link>
					) : null
				}
			/>

			<UsersTabs activeCount={activeCount} deletedCount={deletedCount} />

			{children}
		</div>
	);
}
