"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getDepartmentsAction } from "@/lib/actions/department-actions";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
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
	const { data: session } = useSession();
	const [departments, setDepartments] = useState<Department[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);

	const userRole = (session?.user?.role as string) ?? "STAFF";
	const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

	useEffect(() => {
		if (!isAdmin) {
			router.replace("/dashboard");
			return;
		}

		async function load() {
			const result = await getDepartmentsAction();
			if (result.success) {
				setDepartments(result.data);
			}
			setIsLoading(false);
		}
		load();
	}, [isAdmin, router]);

	if (!isAdmin) return null;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Departments</h2>
				<Button onClick={() => setShowCreate(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Department
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			) : (
				<DepartmentTable departments={departments} />
			)}

			<DepartmentFormDialog
				mode="create"
				open={showCreate}
				onClose={() => setShowCreate(false)}
			/>
		</div>
	);
}
