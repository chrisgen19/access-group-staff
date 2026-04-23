import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ProfileNav } from "./_components/profile-nav";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = await prisma.user.findUniqueOrThrow({
		where: { id: session.user.id },
		select: { email: true, role: true, department: { select: { name: true } } },
	});

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Account"
				title="My Profile"
				description={user.email}
				meta={
					<>
						<Badge variant="outline">{user.role}</Badge>
						{user.department && <Badge variant="secondary">{user.department.name}</Badge>}
					</>
				}
			/>

			<div className="flex flex-col gap-8 sm:flex-row">
				<ProfileNav />
				<div className="flex-1 min-w-0">{children}</div>
			</div>
		</div>
	);
}
