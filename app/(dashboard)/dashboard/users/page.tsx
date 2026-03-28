import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { canViewUsers } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma";
import { UserListClient } from "./_components/user-list-client";

export default async function UsersPage() {
	const session = await getServerSession();
	if (!session || !canViewUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	return <UserListClient />;
}
