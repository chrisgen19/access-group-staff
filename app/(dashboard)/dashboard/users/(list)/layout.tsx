import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
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
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						Staff Directory
					</h1>
					<p className="mt-2 text-base text-muted-foreground">
						Manage staff accounts, roles, and department assignments.
					</p>
				</div>
				{canAdd && (
					<Link
						href="/dashboard/users/new"
						className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
					>
						<Plus className="-ml-1 h-5 w-5" />
						Add Staff Member
					</Link>
				)}
			</div>

			<UsersTabs activeCount={activeCount} deletedCount={deletedCount} />

			{children}
		</div>
	);
}
