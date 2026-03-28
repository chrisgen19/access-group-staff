"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getDepartmentsAction } from "@/lib/actions/department-actions";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentTable } from "./_components/department-table";
import { DepartmentFormDialog } from "./_components/department-form";

interface Department {
	id: string;
	name: string;
	code: string;
	_count: { users: number };
}

export default function DepartmentsPage() {
	const router = useRouter();
	const { data: session, isPending: isSessionPending } = useSession();
	const [departments, setDepartments] = useState<Department[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);

	const userRole = (session?.user?.role as string) ?? "STAFF";
	const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

	const loadDepartments = useCallback(async () => {
		setIsLoading(true);
		const result = await getDepartmentsAction();
		if (result.success) {
			setDepartments(result.data);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (isSessionPending) return;

		if (!isAdmin) {
			router.replace("/dashboard");
			return;
		}

		loadDepartments();
	}, [isSessionPending, isAdmin, router, loadDepartments]);

	if (isSessionPending || !isAdmin) return null;

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
