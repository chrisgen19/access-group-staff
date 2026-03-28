"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteDepartmentAction } from "@/lib/actions/department-actions";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Code</TableHead>
							<TableHead>Users</TableHead>
							<TableHead className="w-[100px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{departments.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground py-8">
									No departments found
								</TableCell>
							</TableRow>
						) : (
							departments.map((dept) => (
								<TableRow key={dept.id}>
									<TableCell className="font-medium">{dept.name}</TableCell>
									<TableCell>{dept.code}</TableCell>
									<TableCell>{dept._count.users}</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setEditTarget(dept)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setDeleteTarget(dept)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Department</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
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
		</>
	);
}
