import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { UserForm } from "../_components/user-form";

export default async function NewUserPage() {
	const session = await getServerSession();
	if (!session || !canManageUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Staff"
				title="Add Staff Member"
				description="Create a new staff account, assign a role, and configure the initial work details."
			/>
			<UserForm
				mode="create"
				currentUserRole={session.user.role as string}
				departments={departments}
			/>
		</div>
	);
}
