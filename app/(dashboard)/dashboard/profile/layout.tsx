import { redirect } from "next/navigation";
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
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					My Profile
				</h1>
				<div className="mt-2 flex items-center gap-2">
					<p className="text-base text-muted-foreground">{user.email}</p>
					<Badge variant="outline">{user.role}</Badge>
					{user.department && <Badge variant="secondary">{user.department.name}</Badge>}
				</div>
			</div>

			<div className="flex flex-col gap-8 sm:flex-row">
				<ProfileNav />
				<div className="flex-1 min-w-0">{children}</div>
			</div>
		</div>
	);
}
