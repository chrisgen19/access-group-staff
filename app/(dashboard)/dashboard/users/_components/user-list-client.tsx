"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronLeft,
	ChevronRight,
	Eye,
	Pencil,
	Plus,
	Search,
	UserCheck,
	Users,
	UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toggleUserActiveAction } from "@/lib/actions/user-actions";
import { type ExportUser, generateUserCsv } from "@/lib/users";
import { type DepartmentOption, UserFilterBar } from "./user-filter-bar";

const PAGE_SIZE = 20;

interface User {
	id: string;
	name: string | null;
	email: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	image: string | null;
	role: string;
	isActive: boolean;
	position: string | null;
	branch: string | null;
	department: { id: string; name: string; code: string } | null;
}

interface PaginatedResponse {
	success: boolean;
	data: User[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
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

function TableSkeleton() {
	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden">
			<div className="animate-pulse">
				<div className="h-10 bg-muted/30 border-b" />
				{["r0", "r1", "r2", "r3", "r4"].map((key) => (
					<div key={key} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
						<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
						<div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded ml-auto" />
					</div>
				))}
			</div>
		</div>
	);
}

interface UserListClientProps {
	currentUserRole: string;
	departments: DepartmentOption[];
}

export function UserListClient({ currentUserRole, departments }: UserListClientProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const showRoleFilter = currentUserRole === "SUPERADMIN";

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
	const [selectedBranch, setSelectedBranch] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: filter values are triggers, not read inside effect
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, selectedRoles, selectedStatuses, selectedDepartmentId, selectedBranch]);

	const hasActiveFilters =
		search.length > 0 ||
		selectedRoles.length > 0 ||
		selectedStatuses.length > 0 ||
		selectedDepartmentId.length > 0 ||
		selectedBranch.length > 0;

	function clearFilters() {
		setSearch("");
		setDebouncedSearch("");
		setSelectedRoles([]);
		setSelectedStatuses([]);
		setSelectedDepartmentId("");
		setSelectedBranch("");
	}

	function buildParams(base: URLSearchParams, searchOverride?: string) {
		const effectiveSearch = searchOverride ?? debouncedSearch;
		if (effectiveSearch) base.set("search", effectiveSearch);
		if (selectedRoles.length > 0) base.set("roles", selectedRoles.join(","));
		if (selectedStatuses.length > 0) base.set("statuses", selectedStatuses.join(","));
		if (selectedDepartmentId) base.set("departmentId", selectedDepartmentId);
		if (selectedBranch) base.set("branch", selectedBranch);
		return base;
	}

	const { data, isPending, isError } = useQuery<PaginatedResponse>({
		queryKey: [
			"users",
			page,
			debouncedSearch,
			selectedRoles,
			selectedStatuses,
			selectedDepartmentId,
			selectedBranch,
		],
		queryFn: async () => {
			const params = buildParams(
				new URLSearchParams({
					paginated: "true",
					page: String(page),
					pageSize: String(PAGE_SIZE),
				}),
			);
			const res = await fetch(`/api/users?${params}`);
			if (!res.ok) throw new Error("Failed to fetch users");
			return res.json();
		},
		staleTime: 30_000,
	});

	async function handleToggleActive(userId: string) {
		const result = await toggleUserActiveAction(userId);
		if (result.success) {
			toast.success("User status updated");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		} else {
			toast.error(typeof result.error === "string" ? result.error : "Failed to update status");
		}
	}

	async function exportUsers() {
		setIsExporting(true);
		try {
			const params = buildParams(new URLSearchParams({ export: "true" }), search.trim());
			const res = await fetch(`/api/users?${params}`);
			if (!res.ok) throw new Error("Failed to fetch users");

			const json = (await res.json()) as {
				success: boolean;
				data: ExportUser[];
				total?: number;
				truncated?: boolean;
				limit?: number;
			};
			if (!json.success) throw new Error("Export failed");

			const csv = generateUserCsv(json.data);
			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
			link.click();
			URL.revokeObjectURL(url);
			if (json.truncated && json.total && json.limit) {
				toast.warning(
					`Exported first ${json.data.length} of ${json.total} users. Apply filters to narrow the result set.`,
				);
			} else {
				toast.success(`Exported ${json.data.length} users`);
			}
		} catch {
			toast.error("Failed to export users");
		} finally {
			setIsExporting(false);
		}
	}

	const users = data?.data ?? [];
	const pagination = data?.pagination;

	useEffect(() => {
		if (pagination && pagination.total > 0 && page > pagination.totalPages) {
			setPage(pagination.totalPages);
		}
	}, [pagination, page]);

	return (
		<div className="max-w-7xl mx-auto space-y-6 mt-2">
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
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					Add Staff Member
				</button>
			</div>

			<UserFilterBar
				search={search}
				onSearchChange={setSearch}
				selectedRoles={selectedRoles}
				onSelectedRolesChange={setSelectedRoles}
				selectedStatuses={selectedStatuses}
				onSelectedStatusesChange={setSelectedStatuses}
				selectedDepartmentId={selectedDepartmentId}
				onDepartmentChange={setSelectedDepartmentId}
				selectedBranch={selectedBranch}
				onBranchChange={setSelectedBranch}
				departments={departments}
				showRoleFilter={showRoleFilter}
				hasActiveFilters={hasActiveFilters}
				onClear={clearFilters}
				onExport={exportUsers}
				isExporting={isExporting}
			/>

			{isPending ? (
				<TableSkeleton />
			) : isError ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
					<p className="text-[1.5rem] font-medium text-foreground">Something went wrong</p>
					<p className="mt-2 text-base text-muted-foreground">
						Failed to load staff. Please try again later.
					</p>
				</div>
			) : users.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
					<div className="mb-6 rounded-full bg-background p-6">
						{hasActiveFilters ? (
							<Search size={48} className="text-muted-foreground opacity-40" />
						) : (
							<Users size={48} className="text-muted-foreground opacity-40" />
						)}
					</div>
					<p className="text-[1.5rem] font-medium text-foreground">
						{hasActiveFilters ? "No matching staff" : "No staff yet"}
					</p>
					<p className="mt-2 text-base text-muted-foreground">
						{hasActiveFilters
							? "No staff match your current filters."
							: "Add your first staff member to get started."}
					</p>
					{hasActiveFilters && (
						<button
							type="button"
							onClick={clearFilters}
							className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
						>
							Clear all filters
						</button>
					)}
				</div>
			) : (
				<>
					<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30 hover:bg-muted/30">
									<TableHead>Employee</TableHead>
									<TableHead>Position / Dept</TableHead>
									<TableHead>Branch</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => (
									<TableRow key={user.id} className="group">
										<TableCell>
											<div className="flex items-center gap-3">
												<UserAvatar
													firstName={user.firstName}
													lastName={user.lastName}
													avatar={user.avatar}
													image={user.image}
													size="lg"
													className="border border-gray-100 dark:border-white/10 bg-background text-primary"
												/>
												<div className="min-w-0">
													<p className="text-sm font-medium text-foreground truncate">
														{user.firstName} {user.lastName}
													</p>
													<p className="text-xs text-muted-foreground truncate">{user.email}</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<p className="text-sm font-medium text-foreground">{user.position ?? "—"}</p>
											<p className="text-xs text-muted-foreground">
												{user.department?.name ?? "—"}
											</p>
										</TableCell>
										<TableCell>
											<span className="text-sm text-foreground">{user.branch ?? "—"}</span>
										</TableCell>
										<TableCell>
											<div className="flex flex-col gap-1.5">
												{currentUserRole === "SUPERADMIN" && (
													<Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
												)}
												<Badge variant={user.isActive ? "outline" : "destructive"}>
													{user.isActive ? "Active" : "Inactive"}
												</Badge>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100">
												<button
													type="button"
													onClick={() => router.push(`/dashboard/users/${user.id}`)}
													className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
													aria-label="View user"
												>
													<Eye size={16} />
												</button>
												<button
													type="button"
													onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
													className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
													aria-label="Edit user"
												>
													<Pencil size={16} />
												</button>
												<button
													type="button"
													onClick={() => handleToggleActive(user.id)}
													className="rounded-full p-2 text-muted-foreground hover:bg-[oklch(0.96_0.03_18)] hover:text-primary dark:hover:bg-primary/10 transition-colors"
													aria-label={user.isActive ? "Deactivate user" : "Activate user"}
												>
													{user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
												</button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{pagination && pagination.totalPages > 1 && (
						<div className="flex items-center justify-between pt-2">
							<p className="text-sm text-muted-foreground">
								Showing {(pagination.page - 1) * pagination.pageSize + 1}–
								{Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
								{pagination.total} staff
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
									className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
								>
									<ChevronLeft size={16} />
									Previous
								</button>
								<span className="text-sm font-medium text-foreground">
									{pagination.page} / {pagination.totalPages}
								</span>
								<button
									type="button"
									disabled={page >= pagination.totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
								>
									Next
									<ChevronRight size={16} />
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
