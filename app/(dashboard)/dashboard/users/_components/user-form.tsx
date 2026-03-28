"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createUserAction, updateUserAction } from "@/lib/actions/user-actions";
import {
	createUserSchema,
	updateUserSchema,
	type CreateUserInput,
	type UpdateUserInput,
} from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
	const [isLoading, setIsLoading] = useState(false);
	const isCreate = mode === "create";

	const schema = isCreate ? createUserSchema : updateUserSchema;
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CreateUserInput>({
		resolver: zodResolver(schema),
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
			? (["STAFF", "ADMIN", "SUPERADMIN"] as const)
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
			router.push("/dashboard/users");
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="max-w-2xl">
			<CardHeader>
				<CardTitle>{isCreate ? "Create User" : "Edit User"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input id="firstName" {...register("firstName")} />
							{errors.firstName && (
								<p className="text-sm text-destructive">{errors.firstName.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input id="lastName" {...register("lastName")} />
							{errors.lastName && (
								<p className="text-sm text-destructive">{errors.lastName.message}</p>
							)}
						</div>
					</div>

					{isCreate && (
						<>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" type="email" {...register("email")} />
								{errors.email && (
									<p className="text-sm text-destructive">{errors.email.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input id="password" type="password" {...register("password")} />
								{errors.password && (
									<p className="text-sm text-destructive">{errors.password.message}</p>
								)}
							</div>
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor="displayName">Display Name</Label>
						<Input id="displayName" {...register("displayName")} />
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input id="phone" {...register("phone")} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="position">Position</Label>
							<Input id="position" {...register("position")} />
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Role</Label>
							<Select
								value={roleValue}
								onValueChange={(value) =>
									setValue("role", value as CreateUserInput["role"])
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									{availableRoles.map((role) => (
										<SelectItem key={role} value={role}>
											{role}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.role && (
								<p className="text-sm text-destructive">{errors.role.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label>Department</Label>
							<Select
								value={watch("departmentId") ?? "none"}
								onValueChange={(value) =>
									setValue("departmentId", value === "none" ? null : value)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No Department</SelectItem>
									{departments.map((dept) => (
										<SelectItem key={dept.id} value={dept.id}>
											{dept.name} ({dept.code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="isActive"
							checked={isActiveValue}
							onCheckedChange={(checked) => setValue("isActive", checked === true)}
						/>
						<Label htmlFor="isActive">Active</Label>
					</div>

					<div className="flex gap-3">
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{isCreate ? "Create User" : "Save Changes"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/dashboard/users")}
						>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
