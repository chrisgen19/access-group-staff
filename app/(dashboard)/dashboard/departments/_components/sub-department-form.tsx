"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	createSubDepartmentAction,
	updateSubDepartmentAction,
} from "@/lib/actions/department-actions";
import { type SubDepartmentInput, subDepartmentSchema } from "@/lib/validations/department";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

interface SubDepartmentFormDialogProps {
	mode: "create" | "edit";
	departmentId: string;
	departmentName: string;
	subDepartment?: { id: string; name: string };
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function SubDepartmentFormDialog({
	mode,
	departmentId,
	departmentName,
	subDepartment,
	open,
	onClose,
	onSuccess,
}: SubDepartmentFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<SubDepartmentInput>({
		resolver: zodResolver(subDepartmentSchema),
		defaultValues: { name: subDepartment?.name ?? "" },
	});

	async function onSubmit(data: SubDepartmentInput) {
		if (mode === "edit" && !subDepartment?.id) {
			toast.error("Missing sub-department id");
			return;
		}
		setIsLoading(true);
		try {
			const result =
				mode === "create"
					? await createSubDepartmentAction(departmentId, data)
					: await updateSubDepartmentAction(subDepartment?.id as string, data);

			if (!result.success) {
				const errorMsg = typeof result.error === "string" ? result.error : "Validation failed";
				toast.error(errorMsg);
				return;
			}

			toast.success(mode === "create" ? "Sub-department created" : "Sub-department updated");
			reset();
			onClose();
			onSuccess?.();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="max-w-lg gap-0 rounded-[2rem] p-0 ring-0 border border-gray-100 dark:border-white/5 shadow-2xl"
				showCloseButton={false}
			>
				<DialogHeader className="px-8 pt-8 pb-2">
					<DialogTitle className="text-[1.5rem] leading-tight font-medium tracking-tight">
						{mode === "create" ? "Add Sub-department" : "Edit Sub-department"}
					</DialogTitle>
					<p className="text-sm text-muted-foreground">{departmentName}</p>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-5 px-8 py-6">
						<div>
							<label
								htmlFor="sub-dept-name"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Sub-department Name
							</label>
							<input
								id="sub-dept-name"
								placeholder="Team Power BI"
								className={inputClass}
								{...register("name")}
							/>
							{errors.name && (
								<p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
							)}
						</div>
					</div>

					<div className="flex flex-col-reverse gap-2 border-t border-gray-200/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] px-8 py-6 rounded-b-[2rem] sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex w-full justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200 sm:w-auto"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50 sm:w-auto"
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{mode === "create" ? "Add" : "Save"}
						</button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
