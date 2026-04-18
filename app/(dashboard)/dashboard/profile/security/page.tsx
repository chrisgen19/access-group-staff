import { Link2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ChangePasswordForm } from "../_components/change-password-form";

export default async function SecurityPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const credentialAccount = await prisma.account.findFirst({
		where: { userId: session.user.id, providerId: "credential" },
		select: { id: true },
	});

	if (!credentialAccount) {
		return (
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
				<div className="px-8 pt-8 pb-2">
					<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
						Change Password
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Your account does not have a password login. You currently sign in with a connected
						account (Google or Microsoft). To set a password, contact an administrator.
					</p>
				</div>
				<div className="px-8 py-6">
					<Link
						href="/dashboard/profile/connected-accounts"
						className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
					>
						<Link2 className="h-4 w-4" />
						Manage Connected Accounts
					</Link>
				</div>
			</div>
		);
	}

	return <ChangePasswordForm />;
}
