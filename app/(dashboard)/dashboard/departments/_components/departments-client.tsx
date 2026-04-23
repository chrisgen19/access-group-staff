"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";
import { getDepartmentsAction } from "@/lib/actions/department-actions";
import { DepartmentFormDialog } from "./department-form";
import { DepartmentTable } from "./department-table";

interface Department {
	id: string;
	name: string;
	code: string;
	_count: { users: number };
}

export function DepartmentsClient() {
	const [departments, setDepartments] = useState<Department[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);

	const loadDepartments = useCallback(async () => {
		setIsLoading(true);
		const result = await getDepartmentsAction();
		if (result.success) {
			setDepartments(result.data);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		loadDepartments();
	}, [loadDepartments]);

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Operations"
				title="Departments"
				description="Manage organizational departments and team structure."
				actions={
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30"
					>
						<Plus className="-ml-1 h-5 w-5" />
						Add Department
					</button>
				}
			/>

			{isLoading ? (
				<SkeletonCard
					className="overflow-hidden animate-pulse"
					role="status"
					aria-busy="true"
					aria-label="Loading departments"
				>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
							<thead>
								<tr>
									<th className="px-8 py-4 text-left w-full">
										<SkeletonLine className="h-3 w-12" />
									</th>
									<th className="px-8 py-4 text-left">
										<SkeletonLine className="h-3 w-10" />
									</th>
									<th className="px-8 py-4 text-left">
										<SkeletonLine className="h-3 w-12" />
									</th>
									<th className="px-8 py-4 w-[100px]">
										<span className="sr-only">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200/60 dark:divide-white/10">
								{["d0", "d1", "d2", "d3"].map((key) => (
									<tr key={key}>
										<td className="px-8 py-5">
											<SkeletonLine className="h-4 w-40" />
										</td>
										<td className="px-8 py-5">
											<SkeletonLine className="h-4 w-20" />
										</td>
										<td className="px-8 py-5">
											<SkeletonLine className="h-4 w-8" />
										</td>
										<td className="px-8 py-5">
											<div className="flex justify-end gap-1">
												<SkeletonLine className="h-8 w-8 rounded-full" />
												<SkeletonLine className="h-8 w-8 rounded-full" />
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</SkeletonCard>
			) : (
				<DepartmentTable departments={departments} onMutate={loadDepartments} />
			)}

			<DepartmentFormDialog
				mode="create"
				open={showCreate}
				onClose={() => setShowCreate(false)}
				onSuccess={loadDepartments}
			/>
		</div>
	);
}
