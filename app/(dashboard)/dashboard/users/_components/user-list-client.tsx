"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronLeft,
	ChevronRight,
	Eye,
	Pencil,
	RotateCcw,
	Search,
	Trash2,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SkeletonLine } from "@/components/shared/skeleton-primitives";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { restoreUserAction, softDeleteUserAction } from "@/lib/actions/user-actions";
import { type ExportUser, generateUserCsv } from "@/lib/users";
import { cn } from "@/lib/utils";
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
	deletedAt: string | null;
	position: string | null;
	branch: string | null;
	createdAt: string;
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

const joinedDateFormatter = new Intl.DateTimeFormat("en-AU", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

function formatJoinedDate(value: string) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "—";
	return joinedDateFormatter.format(parsed);
}

function TableSkeleton() {
	return (
		<div
			className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden animate-pulse shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]"
			role="status"
			aria-busy="true"
			aria-label="Loading staff"
		>
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/30 hover:bg-muted/30">
						<TableHead>
							<SkeletonLine className="h-3 w-20" />
						</TableHead>
						<TableHead className="w-full">
							<SkeletonLine className="h-3 w-28" />
						</TableHead>
						<TableHead>
							<SkeletonLine className="h-3 w-14" />
						</TableHead>
						<TableHead>
							<SkeletonLine className="h-3 w-14" />
						</TableHead>
						<TableHead>
							<SkeletonLine className="h-3 w-14" />
						</TableHead>
						<TableHead className="text-right">
							<SkeletonLine className="h-3 w-14 ml-auto" />
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{["r0", "r1", "r2", "r3", "r4"].map((key) => (
						<TableRow key={key}>
							<TableCell>
								<div className="flex items-center gap-3">
									<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
									<div className="space-y-1 min-w-0">
										<SkeletonLine className="h-4 w-32" />
										<SkeletonLine className="h-3 w-40" />
									</div>
								</div>
							</TableCell>
							<TableCell>
								<div className="space-y-1">
									<SkeletonLine className="h-4 w-32" />
									<SkeletonLine className="h-3 w-24" />
								</div>
							</TableCell>
							<TableCell>
								<SkeletonLine className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<SkeletonLine className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<SkeletonLine className="h-5 w-16 rounded-md" />
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-1">
									<SkeletonLine className="h-8 w-8 rounded-full" />
									<SkeletonLine className="h-8 w-8 rounded-full" />
									<SkeletonLine className="h-8 w-8 rounded-full" />
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

interface UserListClientProps {
	mode: "active" | "deleted";
	currentUserRole: string;
	departments: DepartmentOption[];
}

export function UserListClient({ mode, currentUserRole, departments }: UserListClientProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const showRoleFilter = currentUserRole === "SUPERADMIN";
	const isDeletedView = mode === "deleted";

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
	const [selectedBranch, setSelectedBranch] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
	const [isMutating, setIsMutating] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: filter values are triggers, not read inside effect
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, selectedRoles, selectedDepartmentId, selectedBranch]);

	const hasActiveFilters =
		search.length > 0 ||
		selectedRoles.length > 0 ||
		selectedDepartmentId.length > 0 ||
		selectedBranch.length > 0;

	function clearFilters() {
		setSearch("");
		setDebouncedSearch("");
		setSelectedRoles([]);
		setSelectedDepartmentId("");
		setSelectedBranch("");
	}

	function buildParams(base: URLSearchParams, searchOverride?: string) {
		const effectiveSearch = searchOverride ?? debouncedSearch;
		if (effectiveSearch) base.set("search", effectiveSearch);
		if (selectedRoles.length > 0) base.set("roles", selectedRoles.join(","));
		if (isDeletedView) base.set("onlyDeleted", "true");
		if (selectedDepartmentId) base.set("departmentId", selectedDepartmentId);
		if (selectedBranch) base.set("branch", selectedBranch);
		return base;
	}

	const { data, isPending, isError } = useQuery<PaginatedResponse>({
		queryKey: [
			"users",
			mode,
			page,
			debouncedSearch,
			selectedRoles,
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

	async function handleConfirmDelete() {
		if (!deleteTarget) return;
		setIsMutating(true);
		try {
			const result = await softDeleteUserAction(deleteTarget.id);
			if (result.success) {
				toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted`);
				queryClient.invalidateQueries({ queryKey: ["users"] });
				setDeleteTarget(null);
			} else {
				toast.error(typeof result.error === "string" ? result.error : "Failed to delete user");
			}
		} finally {
			setIsMutating(false);
		}
	}

	async function handleRestore(user: User) {
		const result = await restoreUserAction(user.id);
		if (result.success) {
			toast.success(`${user.firstName} ${user.lastName} restored`);
			queryClient.invalidateQueries({ queryKey: ["users"] });
		} else {
			toast.error(typeof result.error === "string" ? result.error : "Failed to restore user");
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
		<div className="space-y-6">
			<UserFilterBar
				search={search}
				onSearchChange={setSearch}
				selectedRoles={selectedRoles}
				onSelectedRolesChange={setSelectedRoles}
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
						{hasActiveFilters
							? "No matching staff"
							: isDeletedView
								? "No deleted staff"
								: "No staff yet"}
					</p>
					<p className="mt-2 text-base text-muted-foreground">
						{hasActiveFilters
							? "No staff match your current filters."
							: isDeletedView
								? "Deleted staff will appear here."
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
									<TableHead>Joined</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => {
									const isDeleted = user.deletedAt !== null;
									return (
										<TableRow key={user.id} className={cn("group", isDeleted && "opacity-60")}>
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
												<p className="text-sm font-medium text-foreground">
													{user.position ?? "—"}
												</p>
												<p className="text-xs text-muted-foreground">
													{user.department?.name ?? "—"}
												</p>
											</TableCell>
											<TableCell>
												<span className="text-sm text-foreground">{user.branch ?? "—"}</span>
											</TableCell>
											<TableCell>
												<span className="text-sm text-foreground">
													{formatJoinedDate(user.createdAt)}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-1.5">
													{currentUserRole === "SUPERADMIN" && (
														<Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
													)}
													{isDeleted && <Badge variant="destructive">Deleted</Badge>}
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
													{!isDeleted && (
														<button
															type="button"
															onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
															className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
															aria-label="Edit user"
														>
															<Pencil size={16} />
														</button>
													)}
													{isDeleted ? (
														<button
															type="button"
															onClick={() => handleRestore(user)}
															className="rounded-full p-2 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 transition-colors"
															aria-label="Restore user"
														>
															<RotateCcw size={16} />
														</button>
													) : (
														<button
															type="button"
															onClick={() => setDeleteTarget(user)}
															className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
															aria-label="Delete user"
														>
															<Trash2 size={16} />
														</button>
													)}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
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

			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this user?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteTarget
								? `${deleteTarget.firstName} ${deleteTarget.lastName} will lose access and be hidden from the staff directory. Their recognition history stays intact. You can restore them later.`
								: ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={isMutating}
							className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/50"
						>
							{isMutating ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
