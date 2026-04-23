import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { ResetPasswordForm } from "../../_components/reset-password-form";
import { UserForm } from "../../_components/user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession();
	if (!session || !canManageUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const { id } = await params;
	const [user, departments] = await Promise.all([
		prisma.user.findUnique({
			where: { id },
			include: { shiftSchedule: { include: { days: { orderBy: { dayOfWeek: "asc" } } } } },
		}),
		prisma.department.findMany({ orderBy: { name: "asc" } }),
	]);

	if (!user) notFound();
	if (user.deletedAt !== null) {
		redirect(`/dashboard/users/${user.id}`);
	}

	const scheduleDefault = user.shiftSchedule
		? {
				timezone: user.shiftSchedule.timezone,
				days: Array.from({ length: 7 }, (_, dayOfWeek) => {
					const existing = user.shiftSchedule?.days.find((d) => d.dayOfWeek === dayOfWeek);
					return {
						dayOfWeek,
						isWorking: existing?.isWorking ?? false,
						startTime: existing?.startTime ?? null,
						endTime: existing?.endTime ?? null,
						breakMins: existing?.breakMins ?? 0,
					};
				}),
			}
		: null;

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<Link
				href={`/dashboard/users/${user.id}`}
				aria-label="Back to user details"
				className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-200/50 hover:text-foreground dark:hover:bg-white/5"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to user details
			</Link>
			<DashboardPageHeader
				eyebrow="Staff"
				title={`Edit ${user.firstName} ${user.lastName}`}
				description={user.email}
			/>

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
					hireDate: user.hireDate,
					birthday: user.birthday,
					shiftSchedule: scheduleDefault,
				}}
			/>
			<ResetPasswordForm userId={user.id} userName={`${user.firstName} ${user.lastName}`} />
		</div>
	);
}
