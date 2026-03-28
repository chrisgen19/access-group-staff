"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import {
	createDepartmentAction,
	updateDepartmentAction,
} from "@/lib/actions/department-actions";
import { departmentSchema, type DepartmentInput } from "@/lib/validations/department";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200";

interface DepartmentFormDialogProps {
	mode: "create" | "edit";
	department?: { id: string; name: string; code: string };
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function DepartmentFormDialog({
	mode,
	department,
	open,
	onClose,
	onSuccess,
}: DepartmentFormDialogProps) {
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
			onSuccess?.();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
			<div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
				<div
					className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
					onClick={onClose}
				/>
				<span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
				<div className="relative inline-block w-full max-w-lg transform overflow-hidden rounded-[2rem] border border-gray-100 dark:border-white/5 bg-card text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle">
					<div className="flex items-center justify-between px-8 pt-8 pb-2">
						<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
							{mode === "create" ? "Create Department" : "Edit Department"}
						</h3>
						<button
							type="button"
							onClick={onClose}
							className="rounded-full p-2 text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-foreground transition-colors"
						>
							<X size={22} />
						</button>
					</div>

					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="space-y-5 px-8 py-6">
							<div>
								<label htmlFor="name" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Department Name
								</label>
								<input
									id="name"
									placeholder="Engineering"
									className={inputClass}
									{...register("name")}
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
								)}
							</div>
							<div>
								<label htmlFor="code" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Code
								</label>
								<input
									id="code"
									placeholder="ENG"
									className={`${inputClass} uppercase`}
									{...register("code")}
								/>
								{errors.code && (
									<p className="mt-1 text-sm text-destructive">{errors.code.message}</p>
								)}
							</div>
						</div>

						<div className="flex flex-col-reverse gap-2 border-t border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] px-8 py-6 sm:flex-row sm:justify-end">
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
								className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 sm:w-auto"
							>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{mode === "create" ? "Create" : "Save"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
