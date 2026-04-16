import { redirect, notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { canManageUsers } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/client";
import { UserForm } from "../../_components/user-form";
import { ResetPasswordForm } from "../../_components/reset-password-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession();
	if (!session || !canManageUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const { id } = await params;
	const [user, departments] = await Promise.all([
		prisma.user.findUnique({ where: { id } }),
		prisma.department.findMany({ orderBy: { name: "asc" } }),
	]);

	if (!user) notFound();

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<UserForm
				mode="edit"
				userId={user.id}
				currentUserRole={session.user.role as string}
				departments={departments}
				defaultValues={{
					firstName: user.firstName,
					lastName: user.lastName,
					displayName: user.displayName ?? undefined,
					phone: user.phone ?? undefined,
					position: user.position ?? undefined,
					branch: user.branch ?? null,
					role: user.role,
					departmentId: user.departmentId,
					isActive: user.isActive,
				}}
			/>
			<div className="max-w-2xl">
				<ResetPasswordForm
					userId={user.id}
					userName={`${user.firstName} ${user.lastName}`}
				/>
			</div>
		</div>
	);
}
