"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
						Departments
					</h1>
					<p className="mt-2 text-base text-muted-foreground">
						Manage organizational departments and team structure.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
				>
					<Plus className="-ml-1 h-5 w-5" />
					Add Department
				</button>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
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
