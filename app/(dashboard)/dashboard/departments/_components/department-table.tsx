"use client";

import {
	AlertCircle,
	Building2,
	ChevronDown,
	ChevronRight,
	Layers,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
	deleteDepartmentAction,
	deleteSubDepartmentAction,
} from "@/lib/actions/department-actions";
import { DepartmentFormDialog } from "./department-form";
import { SubDepartmentFormDialog } from "./sub-department-form";

interface SubDepartment {
	id: string;
	name: string;
	_count: { users: number };
}

interface Department {
	id: string;
	name: string;
	code: string;
	_count: { users: number };
	subDepartments: SubDepartment[];
}

export function DepartmentTable({
	departments,
	onMutate,
}: {
	departments: Department[];
	onMutate?: () => void;
}) {
	const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
	const [editTarget, setEditTarget] = useState<Department | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const [subCreateDept, setSubCreateDept] = useState<Department | null>(null);
	const [subEditTarget, setSubEditTarget] = useState<{
		dept: Department;
		sub: SubDepartment;
	} | null>(null);
	const [subDeleteTarget, setSubDeleteTarget] = useState<SubDepartment | null>(null);
	const [isDeletingSub, setIsDeletingSub] = useState(false);

	function toggleExpanded(id: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const result = await deleteDepartmentAction(deleteTarget.id);
			if (result.success) {
				toast.success("Department deleted");
				onMutate?.();
			} else {
				toast.error(typeof result.error === "string" ? result.error : "Delete failed");
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsDeleting(false);
			setDeleteTarget(null);
		}
	}

	async function handleDeleteSub() {
		if (!subDeleteTarget) return;
		setIsDeletingSub(true);
		try {
			const result = await deleteSubDepartmentAction(subDeleteTarget.id);
			if (result.success) {
				toast.success("Sub-department deleted");
				onMutate?.();
			} else {
				toast.error(typeof result.error === "string" ? result.error : "Delete failed");
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsDeletingSub(false);
			setSubDeleteTarget(null);
		}
	}

	return (
		<>
			<div className="overflow-hidden rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
						<thead>
							<tr>
								<th className="px-8 py-4 text-left text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
									Name
								</th>
								<th className="px-8 py-4 text-left text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
									Code
								</th>
								<th className="px-8 py-4 text-left text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
									Users
								</th>
								<th className="relative px-8 py-4 w-[100px]">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200/60 dark:divide-white/10">
							{departments.length === 0 ? (
								<tr>
									<td colSpan={4} className="px-8 py-16 text-center">
										<div className="flex flex-col items-center justify-center text-muted-foreground">
											<Building2 size={40} className="mb-3 opacity-20" />
											<p className="text-base font-medium text-foreground">No departments found</p>
										</div>
									</td>
								</tr>
							) : (
								departments.map((dept) => {
									const isExpanded = expanded.has(dept.id);
									return (
										<tr
											key={dept.id}
											className="group align-top transition-colors hover:bg-background"
										>
											<td colSpan={4} className="p-0">
												<div className="flex items-center">
													<button
														type="button"
														onClick={() => toggleExpanded(dept.id)}
														aria-expanded={isExpanded}
														aria-label={
															isExpanded ? "Collapse sub-departments" : "Expand sub-departments"
														}
														className="flex flex-1 items-center gap-3 px-8 py-5 text-left"
													>
														<span className="text-muted-foreground transition-transform">
															{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
														</span>
														<span className="min-w-[12rem] flex-1 text-sm font-medium text-foreground">
															{dept.name}
															{dept.subDepartments.length > 0 && (
																<span className="ml-2 text-xs font-normal text-muted-foreground">
																	· {dept.subDepartments.length} sub-
																	{dept.subDepartments.length === 1 ? "dept" : "depts"}
																</span>
															)}
														</span>
														<span className="hidden w-24 text-sm text-muted-foreground sm:inline">
															{dept.code}
														</span>
														<span className="hidden w-16 text-sm text-muted-foreground sm:inline">
															{dept._count.users}
														</span>
													</button>
													<div className="flex justify-end gap-1 px-6 py-5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100">
														<button
															type="button"
															onClick={() => setEditTarget(dept)}
															aria-label={`Edit department ${dept.name}`}
															className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
															title="Edit department"
														>
															<Pencil size={18} />
														</button>
														<button
															type="button"
															onClick={() => setDeleteTarget(dept)}
															aria-label={`Delete department ${dept.name}`}
															className="rounded-full p-2 text-muted-foreground hover:bg-[oklch(0.96_0.03_18)] hover:text-primary dark:hover:bg-primary/10 transition-colors"
															title="Delete department"
														>
															<Trash2 size={18} />
														</button>
													</div>
												</div>

												{isExpanded && (
													<div className="border-t border-gray-200/60 bg-background/60 px-8 py-5 pl-16 dark:border-white/10">
														<div className="mb-3 flex items-center justify-between gap-3">
															<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
																<Layers size={14} />
																Sub-departments
															</div>
															<button
																type="button"
																onClick={() => setSubCreateDept(dept)}
																className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
															>
																<Plus size={14} />
																Add
															</button>
														</div>

														{dept.subDepartments.length === 0 ? (
															<p className="py-3 text-sm text-muted-foreground">
																No sub-departments yet.
															</p>
														) : (
															<ul className="divide-y divide-gray-200/60 dark:divide-white/10">
																{dept.subDepartments.map((sub) => (
																	<li
																		key={sub.id}
																		className="group/sub flex items-center justify-between gap-3 py-2.5"
																	>
																		<div className="min-w-0">
																			<p className="truncate text-sm font-medium text-foreground">
																				{sub.name}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{sub._count.users}{" "}
																				{sub._count.users === 1 ? "user" : "users"}
																			</p>
																		</div>
																		<div className="flex shrink-0 gap-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover/sub:opacity-100 focus-within:opacity-100">
																			<button
																				type="button"
																				onClick={() => setSubEditTarget({ dept, sub })}
																				aria-label={`Edit sub-department ${sub.name}`}
																				className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
																				title="Edit sub-department"
																			>
																				<Pencil size={16} />
																			</button>
																			<button
																				type="button"
																				onClick={() => setSubDeleteTarget(sub)}
																				aria-label={`Delete sub-department ${sub.name}`}
																				className="rounded-full p-2 text-muted-foreground hover:bg-[oklch(0.96_0.03_18)] hover:text-primary dark:hover:bg-primary/10 transition-colors"
																				title="Delete sub-department"
																			>
																				<Trash2 size={16} />
																			</button>
																		</div>
																	</li>
																))}
															</ul>
														)}
													</div>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			<Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<DialogContent
					className="max-w-md gap-0 rounded-[2rem] p-0 ring-0 border border-gray-100 dark:border-white/5 shadow-2xl"
					showCloseButton={false}
				>
					<div className="px-8 pt-8 pb-6">
						<div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:h-12 sm:w-12">
								<AlertCircle className="h-6 w-6 text-destructive" />
							</div>
							<div className="text-center sm:text-left">
								<h3 className="text-[1.25rem] font-medium text-foreground">Delete Department</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									Are you sure you want to delete{" "}
									<span className="font-medium text-foreground">
										&quot;{deleteTarget?.name}&quot;
									</span>
									? This action cannot be undone.
								</p>
							</div>
						</div>
					</div>
					<div className="flex flex-col-reverse gap-2 border-t border-gray-200/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] px-8 py-6 rounded-b-[2rem] sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={() => setDeleteTarget(null)}
							className="inline-flex w-full justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200 sm:w-auto"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isDeleting}
							className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50 sm:w-auto"
						>
							{isDeleting ? "Deleting..." : "Confirm Removal"}
						</button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={!!subDeleteTarget} onOpenChange={() => setSubDeleteTarget(null)}>
				<DialogContent
					className="max-w-md gap-0 rounded-[2rem] p-0 ring-0 border border-gray-100 dark:border-white/5 shadow-2xl"
					showCloseButton={false}
				>
					<div className="px-8 pt-8 pb-6">
						<div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:h-12 sm:w-12">
								<AlertCircle className="h-6 w-6 text-destructive" />
							</div>
							<div className="text-center sm:text-left">
								<h3 className="text-[1.25rem] font-medium text-foreground">
									Delete Sub-department
								</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									Are you sure you want to delete{" "}
									<span className="font-medium text-foreground">
										&quot;{subDeleteTarget?.name}&quot;
									</span>
									? This action cannot be undone.
								</p>
							</div>
						</div>
					</div>
					<div className="flex flex-col-reverse gap-2 border-t border-gray-200/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] px-8 py-6 rounded-b-[2rem] sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={() => setSubDeleteTarget(null)}
							className="inline-flex w-full justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200 sm:w-auto"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDeleteSub}
							disabled={isDeletingSub}
							className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50 sm:w-auto"
						>
							{isDeletingSub ? "Deleting..." : "Confirm Removal"}
						</button>
					</div>
				</DialogContent>
			</Dialog>

			{editTarget && (
				<DepartmentFormDialog
					mode="edit"
					department={editTarget}
					open={!!editTarget}
					onClose={() => setEditTarget(null)}
					onSuccess={onMutate}
				/>
			)}

			{subCreateDept && (
				<SubDepartmentFormDialog
					mode="create"
					departmentId={subCreateDept.id}
					departmentName={subCreateDept.name}
					open={!!subCreateDept}
					onClose={() => setSubCreateDept(null)}
					onSuccess={onMutate}
				/>
			)}

			{subEditTarget && (
				<SubDepartmentFormDialog
					mode="edit"
					departmentId={subEditTarget.dept.id}
					departmentName={subEditTarget.dept.name}
					subDepartment={subEditTarget.sub}
					open={!!subEditTarget}
					onClose={() => setSubEditTarget(null)}
					onSuccess={onMutate}
				/>
			)}
		</>
	);
}
