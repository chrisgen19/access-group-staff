import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-utils";
import { canViewUsers } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/dashboard/users">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div className="flex-1">
					<h2 className="text-3xl font-bold tracking-tight">
						{user.firstName} {user.lastName}
					</h2>
					<p className="text-muted-foreground">{user.email}</p>
				</div>
				<Link href={`/dashboard/users/${user.id}/edit`}>
					<Button>
						<Pencil className="mr-2 h-4 w-4" />
						Edit User
					</Button>
				</Link>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Personal Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<InfoRow label="First Name" value={user.firstName} />
						<InfoRow label="Last Name" value={user.lastName} />
						<InfoRow label="Display Name" value={user.displayName} />
						<InfoRow label="Email" value={user.email} />
						<InfoRow label="Phone" value={user.phone} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Work Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
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
						<Separator />
						<div className="flex justify-between py-1">
							<span className="text-sm text-muted-foreground">Status</span>
							<Badge variant={user.isActive ? "outline" : "destructive"}>
								{user.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
						<InfoRow label="Joined" value={user.createdAt.toLocaleDateString()} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
	return (
		<div className="flex justify-between py-1">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className="text-sm font-medium">{value ?? "—"}</span>
		</div>
	);
}
