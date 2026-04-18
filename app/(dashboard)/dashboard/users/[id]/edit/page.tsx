import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
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
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div className="flex items-center gap-4">
				<Link
					href={`/dashboard/users/${user.id}`}
					aria-label="Back to user details"
					className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight truncate">
						Edit {user.firstName} {user.lastName}
					</h1>
					<p className="mt-1 text-base text-muted-foreground truncate">{user.email}</p>
				</div>
			</div>

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
