import { redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { getServerSession } from "@/lib/auth-utils";
import { canManageDepartments } from "@/lib/permissions";
import { DepartmentsClient } from "./_components/departments-client";

export default async function DepartmentsPage() {
	const session = await getServerSession();
	if (!session || !canManageDepartments(session.user.role as Role)) {
		redirect("/dashboard");
	}

	return <DepartmentsClient />;
}
