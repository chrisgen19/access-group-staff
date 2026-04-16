"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { changePassword } from "@/lib/auth-client";
import {
	changePasswordSchema,
	type ChangePasswordInput,
} from "@/lib/validations/auth";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

export function ChangePasswordForm() {
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ChangePasswordInput>({
		resolver: zodResolver(changePasswordSchema),
	});

	async function onSubmit(data: ChangePasswordInput) {
		setIsLoading(true);
		try {
			const result = await changePassword({
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Failed to change password");
				return;
			}

			toast.success("Password changed successfully");
			reset();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Change Password
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Update your password to keep your account secure.
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="px-8 py-6 space-y-5">
					<div>
						<label
							htmlFor="currentPassword"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							Current Password
						</label>
						<input
							id="currentPassword"
							type="password"
							className={inputClass}
							{...register("currentPassword")}
						/>
						{errors.currentPassword && (
							<p className="mt-1 text-sm text-destructive">
								{errors.currentPassword.message}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="newPassword"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							New Password
						</label>
						<input
							id="newPassword"
							type="password"
							className={inputClass}
							{...register("newPassword")}
						/>
						{errors.newPassword && (
							<p className="mt-1 text-sm text-destructive">
								{errors.newPassword.message}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							Confirm New Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							className={inputClass}
							{...register("confirmPassword")}
						/>
						{errors.confirmPassword && (
							<p className="mt-1 text-sm text-destructive">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>
				</div>

				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end">
					<button
						type="submit"
						disabled={isLoading}
						className="inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Update Password
					</button>
				</div>
			</form>
		</div>
	);
}
