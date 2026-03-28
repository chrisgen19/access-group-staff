"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Eye, Pencil, UserX, UserCheck, Users } from "lucide-react";
import { toggleUserActiveAction } from "@/lib/actions/user-actions";
import { Badge } from "@/components/ui/badge";
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
	const [searchQuery, setSearchQuery] = useState("");

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
	const filteredUsers = users.filter(
		(user) =>
			`${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(user.department?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(user.position ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						Staff Directory
					</h1>
					<p className="mt-2 text-base text-muted-foreground">
						Manage staff accounts, roles, and department assignments.
					</p>
				</div>
				<button
					type="button"
					onClick={() => router.push("/dashboard/users/new")}
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					Add Staff Member
				</button>
			</div>

			<div className="overflow-hidden rounded-[2rem] border border-gray-100/80 dark:border-white/5 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="border-b border-gray-50 dark:border-white/5 p-6">
					<div className="relative max-w-md w-full">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
							<Search className="h-5 w-5 text-muted-foreground" />
						</div>
						<input
							type="text"
							className="block w-full rounded-full border-transparent bg-background py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 transition-all duration-200"
							placeholder="Search staff members..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-100 dark:divide-white/5">
						<thead>
							<tr>
								<th className="px-8 py-4 text-left text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
									Employee
								</th>
								<th className="px-8 py-4 text-left text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
									Position / Dept
								</th>
								<th className="px-8 py-4 text-left text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
									Status
								</th>
								<th className="relative px-8 py-4">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-50 dark:divide-white/5">
							{filteredUsers.length > 0 ? (
								filteredUsers.map((user) => (
									<tr
										key={user.id}
										className="group transition-colors hover:bg-background"
									>
										<td className="whitespace-nowrap px-8 py-5">
											<div className="flex items-center">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-100 dark:border-white/10 bg-background text-primary text-sm font-medium">
													{user.firstName.charAt(0)}
													{user.lastName.charAt(0)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-foreground">
														{user.firstName} {user.lastName}
													</div>
													<div className="mt-0.5 text-sm text-muted-foreground">
														{user.email}
													</div>
												</div>
											</div>
										</td>
										<td className="whitespace-nowrap px-8 py-5">
											<div className="text-sm font-medium text-foreground">
												{user.position ?? "—"}
											</div>
											<div className="mt-0.5 text-sm text-muted-foreground">
												{user.department?.name ?? "—"}
											</div>
										</td>
										<td className="whitespace-nowrap px-8 py-5">
											<div className="flex flex-col gap-1.5">
												<Badge variant={roleBadgeVariant(user.role)}>
													{user.role}
												</Badge>
												<Badge
													variant={user.isActive ? "outline" : "destructive"}
												>
													{user.isActive ? "Active" : "Inactive"}
												</Badge>
											</div>
										</td>
										<td className="whitespace-nowrap px-8 py-5 text-right text-sm font-medium">
											<div className="flex justify-end gap-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100">
												<button
													type="button"
													onClick={() => router.push(`/dashboard/users/${user.id}`)}
													className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
													title="View"
												>
													<Eye size={18} />
												</button>
												<button
													type="button"
													onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
													className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
													title="Edit"
												>
													<Pencil size={18} />
												</button>
												<button
													type="button"
													onClick={() => handleToggleActive(user.id)}
													className="rounded-full p-2 text-muted-foreground hover:bg-[oklch(0.96_0.03_18)] hover:text-primary dark:hover:bg-primary/10 transition-colors"
													title={user.isActive ? "Deactivate" : "Activate"}
												>
													{user.isActive ? (
														<UserX size={18} />
													) : (
														<UserCheck size={18} />
													)}
												</button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={4} className="px-8 py-16 text-center">
										<div className="flex flex-col items-center justify-center text-muted-foreground">
											<Users size={40} className="mb-3 opacity-20" />
											<p className="text-base font-medium text-foreground">
												No staff found
											</p>
											<p className="mt-1 text-sm">
												We couldn&apos;t find anyone matching your search.
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<div className="border-t border-gray-50 dark:border-white/5 bg-card px-8 py-4">
					<p className="text-sm text-muted-foreground">
						Showing{" "}
						<span className="font-medium text-foreground">
							{filteredUsers.length}
						</span>{" "}
						of{" "}
						<span className="font-medium text-foreground">{users.length}</span>{" "}
						results
					</p>
				</div>
			</div>
		</div>
	);
}
