import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = session.user;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					Welcome back, {user.firstName as string ?? user.name}!
				</h2>
				<p className="text-muted-foreground">
					Here&apos;s what&apos;s happening at Access Group today.
				</p>
			</div>
			<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
				<p className="text-lg">Recognition feed coming in Phase 2</p>
				<p className="text-sm mt-1">
					This is where you&apos;ll see recognition cards from your colleagues.
				</p>
			</div>
		</div>
	);
}
