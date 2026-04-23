"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { adminResetPasswordAction } from "@/lib/actions/user-actions";
import { type AdminResetPasswordInput, adminResetPasswordSchema } from "@/lib/validations/auth";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

interface ResetPasswordFormProps {
	userId: string;
	userName: string;
}

export function ResetPasswordForm({ userId, userName }: ResetPasswordFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AdminResetPasswordInput>({
		resolver: zodResolver(adminResetPasswordSchema),
	});

	async function onSubmit(data: AdminResetPasswordInput) {
		setIsLoading(true);
		try {
			const result = await adminResetPasswordAction(userId, data);

			if (!result.success) {
				const errorMsg =
					typeof result.error === "string" ? result.error : "Failed to reset password";
				toast.error(errorMsg);
				return;
			}

			toast.success(`Password reset for ${userName}`);
			reset();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/10">
			<div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
				<h2 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Reset Password
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Set a new password for {userName}. They will need to use this password on their next
					login.
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="space-y-5 px-5 py-6 sm:px-8">
					<div>
						<label
							htmlFor="newPassword"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							New Password
						</label>
						<div className="relative">
							<input
								id="newPassword"
								type={showNewPassword ? "text" : "password"}
								className={inputClass}
								{...register("newPassword")}
							/>
							<button
								type="button"
								onClick={() => setShowNewPassword((prev) => !prev)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								tabIndex={-1}
							>
								{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
						{errors.newPassword && (
							<p className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>
						)}
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							Confirm New Password
						</label>
						<div className="relative">
							<input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								className={inputClass}
								{...register("confirmPassword")}
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword((prev) => !prev)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								tabIndex={-1}
							>
								{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
						{errors.confirmPassword && (
							<p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
						)}
					</div>
				</div>

				<div className="flex justify-end border-t border-gray-200/60 bg-gray-50/50 px-5 py-6 dark:border-white/10 dark:bg-white/[0.02] sm:px-8">
					<button
						type="submit"
						disabled={isLoading}
						className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 sm:w-auto"
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Reset Password
					</button>
				</div>
			</form>
		</div>
	);
}
