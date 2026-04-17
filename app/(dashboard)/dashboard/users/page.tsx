import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { getAllDepartmentsAction } from "@/lib/actions/department-actions";
import { getServerSession } from "@/lib/auth-utils";
import { canViewUsers } from "@/lib/permissions";
import { UserListClient } from "./_components/user-list-client";

export default async function UsersPage() {
	const session = await getServerSession();
	if (!session || !canViewUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const departments = await getAllDepartmentsAction();

	return (
		<UserListClient
			currentUserRole={session.user.role as Role}
			departments={departments.map((d) => ({ id: d.id, name: d.name }))}
		/>
	);
}
