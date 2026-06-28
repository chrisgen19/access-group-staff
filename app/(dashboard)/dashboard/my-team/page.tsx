import { UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { groupUsersBySubDepartment } from "@/lib/team";
import { TeamGroups } from "./_components/team-groups";

export default async function MyTeamPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const viewer = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			departmentId: true,
			subDepartmentId: true,
			department: { select: { name: true } },
		},
	});

	if (!viewer?.departmentId) {
		return (
			<div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
				<DashboardPageHeader
					eyebrow="People"
					title="My Team"
					description="See the colleagues in your department, grouped by sub-department."
				/>
				<div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-200/60 bg-card p-16 text-center dark:border-white/10">
					<div className="mb-6 rounded-full bg-background p-6">
						<UsersRound size={48} className="text-muted-foreground opacity-40" />
					</div>
					<p className="text-[1.5rem] font-medium text-foreground">No department yet</p>
					<p className="mt-2 max-w-md text-base text-muted-foreground">
						You're not assigned to a department yet. Once an admin assigns you to one, your
						teammates will show up here.
					</p>
				</div>
			</div>
		);
	}

	const members = await prisma.user.findMany({
		where: { departmentId: viewer.departmentId, deletedAt: null },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			displayName: true,
			position: true,
			avatar: true,
			image: true,
			email: true,
			branch: true,
			subDepartmentId: true,
			subDepartment: { select: { id: true, name: true } },
		},
		orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
	});

	const groups = groupUsersBySubDepartment(members, viewer.subDepartmentId);
	const departmentName = viewer.department?.name ?? "Department";

	return (
		<div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow={departmentName}
				title="My Team"
				description={`Everyone in ${departmentName}, grouped by sub-department.`}
			/>
			<TeamGroups groups={groups} viewerUserId={session.user.id} />
		</div>
	);
}
