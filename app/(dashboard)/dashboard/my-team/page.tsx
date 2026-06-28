import { BarChart3, UsersRound } from "lucide-react";
import Link from "next/link";
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

	const [members, ledSubDepartments] = await Promise.all([
		prisma.user.findMany({
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
		}),
		prisma.subDepartment.findMany({
			where: { teamLeaderId: session.user.id },
			select: { id: true },
		}),
	]);

	const ledSubDepartmentIds = ledSubDepartments.map((s) => s.id);
	const groups = groupUsersBySubDepartment(members, viewer.subDepartmentId, ledSubDepartmentIds);
	const departmentName = viewer.department?.name ?? "Department";
	const isLeader = ledSubDepartmentIds.length > 0;

	return (
		<div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow={departmentName}
				title="My Team"
				description={`Everyone in ${departmentName}, grouped by sub-department.`}
				actions={
					isLeader ? (
						<Link
							href="/dashboard/my-team/insights"
							className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
						>
							<BarChart3 className="h-4 w-4" />
							Team Insights
						</Link>
					) : null
				}
			/>
			<TeamGroups groups={groups} viewerUserId={session.user.id} />
		</div>
	);
}
