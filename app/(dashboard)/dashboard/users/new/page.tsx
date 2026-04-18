import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
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
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<UserForm
				mode="create"
				currentUserRole={session.user.role as string}
				departments={departments}
			/>
		</div>
	);
}
