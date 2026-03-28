"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, AlertCircle, Building2 } from "lucide-react";
import { deleteDepartmentAction } from "@/lib/actions/department-actions";
import { DepartmentFormDialog } from "./department-form";

interface Department {
	id: string;
	name: string;
	code: string;
	_count: { users: number };
}

export function DepartmentTable({
	departments,
	onMutate,
}: { departments: Department[]; onMutate?: () => void }) {
	const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
	const [editTarget, setEditTarget] = useState<Department | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

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

	return (
		<>
			<div className="overflow-hidden rounded-[2rem] border border-gray-100/80 dark:border-white/5 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-100 dark:divide-white/5">
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
						<tbody className="divide-y divide-gray-50 dark:divide-white/5">
							{departments.length === 0 ? (
								<tr>
									<td colSpan={4} className="px-8 py-16 text-center">
										<div className="flex flex-col items-center justify-center text-muted-foreground">
											<Building2 size={40} className="mb-3 opacity-20" />
											<p className="text-base font-medium text-foreground">
												No departments found
											</p>
										</div>
									</td>
								</tr>
							) : (
								departments.map((dept) => (
									<tr
										key={dept.id}
										className="group transition-colors hover:bg-background"
									>
										<td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-foreground">
											{dept.name}
										</td>
										<td className="whitespace-nowrap px-8 py-5 text-sm text-muted-foreground">
											{dept.code}
										</td>
										<td className="whitespace-nowrap px-8 py-5 text-sm text-muted-foreground">
											{dept._count.users}
										</td>
										<td className="whitespace-nowrap px-8 py-5 text-right text-sm">
											<div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												<button
													type="button"
													onClick={() => setEditTarget(dept)}
													className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
													title="Edit"
												>
													<Pencil size={18} />
												</button>
												<button
													type="button"
													onClick={() => setDeleteTarget(dept)}
													className="rounded-full p-2 text-muted-foreground hover:bg-[oklch(0.96_0.03_18)] hover:text-primary dark:hover:bg-primary/10 transition-colors"
													title="Delete"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Delete Confirmation */}
			{deleteTarget && (
				<div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
					<div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
						<div
							className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
							onClick={() => setDeleteTarget(null)}
						/>
						<span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
						<div className="relative inline-block w-full max-w-md transform overflow-hidden rounded-[2rem] border border-gray-100 dark:border-white/5 bg-card text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle">
							<div className="px-8 pt-8 pb-6">
								<div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
									<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:h-12 sm:w-12">
										<AlertCircle className="h-6 w-6 text-destructive" />
									</div>
									<div className="text-center sm:text-left">
										<h3 className="text-[1.25rem] font-medium text-foreground">
											Delete Department
										</h3>
										<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
											Are you sure you want to delete{" "}
											<span className="font-medium text-foreground">
												&quot;{deleteTarget.name}&quot;
											</span>
											? This action cannot be undone.
										</p>
									</div>
								</div>
							</div>
							<div className="flex flex-col-reverse gap-2 border-t border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] px-8 py-6 sm:flex-row sm:justify-end">
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
									className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 sm:w-auto"
								>
									{isDeleting ? "Deleting..." : "Confirm Removal"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{editTarget && (
				<DepartmentFormDialog
					mode="edit"
					department={editTarget}
					open={!!editTarget}
					onClose={() => setEditTarget(null)}
					onSuccess={onMutate}
				/>
			)}
		</>
	);
}
