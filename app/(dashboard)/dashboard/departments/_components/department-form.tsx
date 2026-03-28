"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
	createDepartmentAction,
	updateDepartmentAction,
} from "@/lib/actions/department-actions";
import { departmentSchema, type DepartmentInput } from "@/lib/validations/department";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DepartmentFormDialogProps {
	mode: "create" | "edit";
	department?: { id: string; name: string; code: string };
	open: boolean;
	onClose: () => void;
}

export function DepartmentFormDialog({
	mode,
	department,
	open,
	onClose,
}: DepartmentFormDialogProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<DepartmentInput>({
		resolver: zodResolver(departmentSchema),
		defaultValues: {
			name: department?.name ?? "",
			code: department?.code ?? "",
		},
	});

	async function onSubmit(data: DepartmentInput) {
		setIsLoading(true);
		try {
			const result =
				mode === "create"
					? await createDepartmentAction(data)
					: await updateDepartmentAction(department!.id, data);

			if (!result.success) {
				const errorMsg =
					typeof result.error === "string" ? result.error : "Validation failed";
				toast.error(errorMsg);
				return;
			}

			toast.success(
				mode === "create" ? "Department created" : "Department updated",
			);
			reset();
			onClose();
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create Department" : "Edit Department"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Department Name</Label>
						<Input id="name" placeholder="Engineering" {...register("name")} />
						{errors.name && (
							<p className="text-sm text-destructive">{errors.name.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="code">Code</Label>
						<Input
							id="code"
							placeholder="ENG"
							className="uppercase"
							{...register("code")}
						/>
						{errors.code && (
							<p className="text-sm text-destructive">{errors.code.message}</p>
						)}
					</div>
					<div className="flex justify-end gap-3">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{mode === "create" ? "Create" : "Save"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
