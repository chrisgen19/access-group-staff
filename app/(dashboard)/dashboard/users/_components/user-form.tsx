"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createUserAction, updateUserAction } from "@/lib/actions/user-actions";
import {
	createUserSchema,
	updateUserSchema,
	type CreateUserInput,
	type UpdateUserInput,
} from "@/lib/validations/user";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200";

const selectClass =
	"block w-full appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200";

interface Department {
	id: string;
	name: string;
	code: string;
}

interface UserFormProps {
	mode: "create" | "edit";
	userId?: string;
	currentUserRole: string;
	departments: Department[];
	defaultValues?: Partial<CreateUserInput>;
}

export function UserForm({
	mode,
	userId,
	currentUserRole,
	departments,
	defaultValues,
}: UserFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);
	const isCreate = mode === "create";

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CreateUserInput>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(isCreate ? createUserSchema : (updateUserSchema as any)),
		defaultValues: {
			role: "STAFF",
			isActive: true,
			...defaultValues,
		},
	});

	const roleValue = watch("role");
	const isActiveValue = watch("isActive");

	const availableRoles =
		currentUserRole === "SUPERADMIN"
			? (["STAFF", "ADMIN"] as const)
			: (["STAFF"] as const);

	useEffect(() => {
		if (defaultValues?.departmentId) {
			setValue("departmentId", defaultValues.departmentId);
		}
		if (defaultValues?.role) {
			setValue("role", defaultValues.role);
		}
	}, [defaultValues, setValue]);

	async function onSubmit(data: CreateUserInput | UpdateUserInput) {
		setIsLoading(true);
		try {
			const result = isCreate
				? await createUserAction(data)
				: await updateUserAction(userId!, data);

			if (!result.success) {
				const errorMsg =
					typeof result.error === "string"
						? result.error
						: "Validation failed. Check the form fields.";
				toast.error(errorMsg);
				return;
			}

			toast.success(isCreate ? "User created successfully" : "User updated successfully");
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			router.push("/dashboard/users");
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="max-w-2xl">
			<div className="rounded-[2rem] border border-gray-50 dark:border-white/5 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
				<div className="px-8 pt-8 pb-2">
					<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
						{isCreate ? "Add Staff Member" : "Edit Staff Details"}
					</h3>
				</div>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="px-8 py-6 space-y-5">
						<div className="grid grid-cols-2 gap-5">
							<div>
								<label htmlFor="firstName" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									First Name
								</label>
								<input id="firstName" className={inputClass} {...register("firstName")} />
								{errors.firstName && (
									<p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
								)}
							</div>
							<div>
								<label htmlFor="lastName" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Last Name
								</label>
								<input id="lastName" className={inputClass} {...register("lastName")} />
								{errors.lastName && (
									<p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
								)}
							</div>
						</div>

						{isCreate && (
							<>
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
										Email
									</label>
									<input id="email" type="email" className={inputClass} {...register("email")} />
									{errors.email && (
										<p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
									)}
								</div>
								<div>
									<label htmlFor="password" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
										Password
									</label>
									<input id="password" type="password" className={inputClass} {...register("password")} />
									{errors.password && (
										<p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
									)}
								</div>
							</>
						)}

						<div>
							<label htmlFor="displayName" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
								Display Name
							</label>
							<input id="displayName" className={inputClass} {...register("displayName")} />
						</div>

						<div className="grid grid-cols-2 gap-5">
							<div>
								<label htmlFor="phone" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Phone
								</label>
								<input id="phone" className={inputClass} {...register("phone")} />
							</div>
							<div>
								<label htmlFor="position" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Position
								</label>
								<input id="position" className={inputClass} {...register("position")} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Role
								</label>
								<select
									value={roleValue}
									onChange={(e) => setValue("role", e.target.value as CreateUserInput["role"])}
									className={selectClass}
								>
									{availableRoles.map((role) => (
										<option key={role} value={role}>
											{role}
										</option>
									))}
								</select>
								{errors.role && (
									<p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Department
								</label>
								<select
									value={watch("departmentId") ?? "none"}
									onChange={(e) => setValue("departmentId", e.target.value === "none" ? null : e.target.value)}
									className={selectClass}
								>
									<option value="none">No Department</option>
									{departments.map((dept) => (
										<option key={dept.id} value={dept.id}>
											{dept.name} ({dept.code})
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="flex items-center gap-2 px-1">
							<input
								id="isActive"
								type="checkbox"
								checked={isActiveValue}
								onChange={(e) => setValue("isActive", e.target.checked)}
								className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<label htmlFor="isActive" className="text-sm font-medium text-foreground/70">
								Active
							</label>
						</div>
					</div>

					<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/5 flex flex-row-reverse gap-3">
						<button
							type="submit"
							disabled={isLoading}
							className="inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50"
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{isCreate ? "Create Record" : "Save Changes"}
						</button>
						<button
							type="button"
							onClick={() => router.push("/dashboard/users")}
							className="inline-flex justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
