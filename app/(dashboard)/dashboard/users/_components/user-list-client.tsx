"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Eye, Pencil, UserX, UserCheck } from "lucide-react";
import { toggleUserActiveAction } from "@/lib/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
	id: string;
	name: string | null;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	isActive: boolean;
	position: string | null;
	department: { id: string; name: string; code: string } | null;
}

function roleBadgeVariant(role: string) {
	switch (role) {
		case "SUPERADMIN":
			return "destructive" as const;
		case "ADMIN":
			return "default" as const;
		default:
			return "secondary" as const;
	}
}

export function UserListClient() {
	const router = useRouter();

	const { data, isPending, error, refetch } = useQuery<{ success: boolean; data: User[] }>({
		queryKey: ["users"],
		queryFn: async () => {
			const res = await fetch("/api/users");
			if (!res.ok) throw new Error("Failed to fetch users");
			return res.json();
		},
	});

	async function handleToggleActive(userId: string) {
		const result = await toggleUserActiveAction(userId);
		if (result.success) {
			toast.success("User status updated");
			refetch();
		} else {
			toast.error(typeof result.error === "string" ? result.error : "Failed to update status");
		}
	}

	if (isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	if (error) {
		return <p className="text-destructive">Failed to load users.</p>;
	}

	const users = data?.data ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Users</h2>
				<Button onClick={() => router.push("/dashboard/users/new")}>
					<Plus className="mr-2 h-4 w-4" />
					Add User
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Department</TableHead>
							<TableHead>Position</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-[60px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center text-muted-foreground py-8">
									No users found
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">
										{user.firstName} {user.lastName}
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.department?.name ?? "—"}</TableCell>
									<TableCell>{user.position ?? "—"}</TableCell>
									<TableCell>
										<Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
									</TableCell>
									<TableCell>
										<Badge variant={user.isActive ? "outline" : "destructive"}>
											{user.isActive ? "Active" : "Inactive"}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger
												render={<Button variant="ghost" size="icon" />}
											>
												<MoreHorizontal className="h-4 w-4" />
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => router.push(`/dashboard/users/${user.id}`)}
												>
													<Eye className="mr-2 h-4 w-4" />
													View
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														router.push(`/dashboard/users/${user.id}/edit`)
													}
												>
													<Pencil className="mr-2 h-4 w-4" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleToggleActive(user.id)}
												>
													{user.isActive ? (
														<>
															<UserX className="mr-2 h-4 w-4" />
															Deactivate
														</>
													) : (
														<>
															<UserCheck className="mr-2 h-4 w-4" />
															Activate
														</>
													)}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
