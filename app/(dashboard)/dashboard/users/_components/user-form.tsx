"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createUserAction, updateUserAction } from "@/lib/actions/user-actions";
import {
	type CreateUserInput,
	createUserSchema,
	type UpdateUserInput,
	updateUserSchema,
} from "@/lib/validations/user";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

const selectClass =
	"block w-full appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

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
	const [showPassword, setShowPassword] = useState(false);
	const isCreate = mode === "create";

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CreateUserInput>({
		// biome-ignore lint/suspicious/noExplicitAny: schemas diverge on optional fields; resolver union narrows at runtime
		resolver: zodResolver((isCreate ? createUserSchema : updateUserSchema) as any),
		defaultValues: {
			role: "STAFF",
			isActive: true,
			...defaultValues,
		},
	});

	const roleValue = watch("role");
	const isActiveValue = watch("isActive");

	const availableRoles =
		currentUserRole === "SUPERADMIN" ? (["STAFF", "ADMIN"] as const) : (["STAFF"] as const);

	// When editing a user whose current role the viewer can't reassign (e.g.
	// an admin editing another admin), lock the dropdown to the target's role
	// and strip `role` from the submission so non-role edits still go through.
	const canEditRole =
		isCreate || (!!roleValue && (availableRoles as readonly string[]).includes(roleValue));

	useEffect(() => {
		if (defaultValues?.departmentId) {
			setValue("departmentId", defaultValues.departmentId);
		}
		if (defaultValues?.role) {
			setValue("role", defaultValues.role);
		}
	}, [defaultValues, setValue]);

	async function onSubmit(data: CreateUserInput | UpdateUserInput) {
		if (!isCreate && !userId) {
			toast.error("Missing user id");
			return;
		}
		setIsLoading(true);
		try {
			const payload = canEditRole ? data : { ...data, role: undefined };
			const result = isCreate
				? await createUserAction(payload as CreateUserInput)
				: await updateUserAction(userId as string, payload);

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
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
				<div className="px-8 pt-8 pb-2">
					<h2 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
						{isCreate ? "Add Staff Member" : "Edit Staff Details"}
					</h2>
				</div>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="px-8 py-6 space-y-5">
						<div className="grid grid-cols-2 gap-5">
							<div>
								<label
									htmlFor="firstName"
									className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
								>
									First Name
								</label>
								<input id="firstName" className={inputClass} {...register("firstName")} />
								{errors.firstName && (
									<p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
								)}
							</div>
							<div>
								<label
									htmlFor="lastName"
									className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
								>
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
									<label
										htmlFor="email"
										className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
									>
										Email
									</label>
									<input id="email" type="email" className={inputClass} {...register("email")} />
									{errors.email && (
										<p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
									)}
								</div>
								<div>
									<label
										htmlFor="password"
										className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
									>
										Password
									</label>
									<div className="relative">
										<input
											id="password"
											type={showPassword ? "text" : "password"}
											className={`${inputClass} pr-11`}
											{...register("password")}
										/>
										<button
											type="button"
											onClick={() => setShowPassword((prev) => !prev)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
											tabIndex={-1}
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>
									{errors.password && (
										<p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
									)}
								</div>
							</>
						)}

						<div>
							<label
								htmlFor="displayName"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Display Name
							</label>
							<input id="displayName" className={inputClass} {...register("displayName")} />
						</div>

						<div className="grid grid-cols-2 gap-5">
							<div>
								<label
									htmlFor="phone"
									className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
								>
									Phone
								</label>
								<input id="phone" className={inputClass} {...register("phone")} />
							</div>
							<div>
								<label
									htmlFor="position"
									className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
								>
									Position
								</label>
								<input id="position" className={inputClass} {...register("position")} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-5">
							<div>
								<label
									htmlFor="role"
									className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
								>
									Role
								</label>
								<select
									id="role"
									value={roleValue}
									onChange={(e) => setValue("role", e.target.value as CreateUserInput["role"])}
									className={selectClass}
									disabled={!canEditRole}
								>
									{canEditRole
										? availableRoles.map((role) => (
												<option key={role} value={role}>
													{role}
												</option>
											))
										: roleValue && (
												<option key={roleValue} value={roleValue}>
													{roleValue}
												</option>
											)}
								</select>
								{!canEditRole && (
									<p className="mt-1 text-xs text-muted-foreground">
										You don't have permission to change this user's role.
									</p>
								)}
								{errors.role && (
									<p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
								)}
							</div>
							<div>
								<label
									htmlFor="departmentId"
									className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
								>
									Department
								</label>
								<select
									id="departmentId"
									value={watch("departmentId") ?? "none"}
									onChange={(e) =>
										setValue("departmentId", e.target.value === "none" ? null : e.target.value)
									}
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

						<div>
							<label
								htmlFor="branch"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Branch
							</label>
							<select
								id="branch"
								value={watch("branch") ?? "none"}
								onChange={(e) =>
									setValue(
										"branch",
										e.target.value === "none" ? null : (e.target.value as "ISO" | "PERTH"),
									)
								}
								className={selectClass}
							>
								<option value="none">No Branch</option>
								<option value="ISO">ISO</option>
								<option value="PERTH">Perth</option>
							</select>
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

					<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex flex-row-reverse gap-3">
						<button
							type="submit"
							disabled={isLoading}
							className="inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
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
