import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-utils";
import { canViewUsers } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession();
	if (!session || !canViewUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const { id } = await params;
	const user = await prisma.user.findUnique({
		where: { id },
		include: { department: true },
	});

	if (!user) notFound();

	return (
		<div className="max-w-5xl mx-auto space-y-8 mt-2">
			<div className="flex items-center gap-4">
				<Link
					href="/dashboard/users"
					className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<div className="flex-1">
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						{user.firstName} {user.lastName}
					</h1>
					<p className="mt-1 text-base text-muted-foreground">{user.email}</p>
				</div>
				<Link
					href={`/dashboard/users/${user.id}/edit`}
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Pencil className="h-4 w-4" />
					Edit User
				</Link>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
					<div className="px-8 pt-8 pb-2">
						<h3 className="text-[1.25rem] font-medium text-foreground">Personal Info</h3>
					</div>
					<div className="px-8 py-6 space-y-4">
						<InfoRow label="First Name" value={user.firstName} />
						<InfoRow label="Last Name" value={user.lastName} />
						<InfoRow label="Display Name" value={user.displayName} />
						<InfoRow label="Email" value={user.email} />
						<InfoRow label="Phone" value={user.phone} />
					</div>
				</div>

				<div className="rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
					<div className="px-8 pt-8 pb-2">
						<h3 className="text-[1.25rem] font-medium text-foreground">Work Info</h3>
					</div>
					<div className="px-8 py-6 space-y-4">
						<InfoRow label="Position" value={user.position} />
						<InfoRow label="Department" value={user.department?.name} />
						<div className="flex justify-between py-1">
							<span className="text-sm text-muted-foreground">Role</span>
							<Badge
								variant={
									user.role === "SUPERADMIN"
										? "destructive"
										: user.role === "ADMIN"
											? "default"
											: "secondary"
								}
							>
								{user.role}
							</Badge>
						</div>
						<div className="h-px bg-gray-100 dark:bg-white/5" />
						<div className="flex justify-between py-1">
							<span className="text-sm text-muted-foreground">Status</span>
							<Badge variant={user.isActive ? "outline" : "destructive"}>
								{user.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
						<InfoRow label="Joined" value={user.createdAt.toLocaleDateString()} />
					</div>
				</div>
			</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
	return (
		<div className="flex justify-between py-1">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
		</div>
	);
}
