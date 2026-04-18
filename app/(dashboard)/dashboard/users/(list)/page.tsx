import type { Role } from "@/app/generated/prisma/client";
import { getAllDepartmentsAction } from "@/lib/actions/department-actions";
import { getServerSession } from "@/lib/auth-utils";
import { UserListClient } from "../_components/user-list-client";

export default async function UsersActivePage() {
	const session = await getServerSession();
	const departments = await getAllDepartmentsAction();

	return (
		<UserListClient
			mode="active"
			currentUserRole={session?.user.role as Role}
			departments={departments.map((d) => ({ id: d.id, name: d.name }))}
		/>
	);
}
