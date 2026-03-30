"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { AccessGroupLogo } from "@/components/shared/access-logos";
import { GoogleIcon, MicrosoftIcon } from "@/components/shared/oauth-icons";
import type { OAuthSettings } from "@/lib/actions/settings-actions";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
	invalid_code: "OAuth sign-up failed. Please try again.",
	access_denied: "OAuth sign-up was cancelled.",
	server_error: "OAuth provider encountered an error. Please try again.",
};

export function RegisterForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [oauthSettings, setOauthSettings] = useState<OAuthSettings | null>(null);
	const [oauthAvailability, setOauthAvailability] = useState<{ google: boolean; microsoft: boolean } | null>(null);

	useEffect(() => {
		fetch("/api/settings/oauth")
			.then((res) => res.json())
			.then((json) => {
				setOauthSettings(json.data);
				setOauthAvailability(json.availability);
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		const error = searchParams.get("error");
		if (error) {
			toast.error(OAUTH_ERROR_MESSAGES[error] ?? "Sign-up failed. Please try again.");
		}
	}, [searchParams]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
	});

	async function handleGoogleSignIn() {
		setIsGoogleLoading(true);
		try {
			const result = await signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
				errorCallbackURL: "/register",
			});
			if (result.error) {
				toast.error(result.error.message ?? "Failed to sign up with Google");
			}
		} catch {
			toast.error("Failed to sign up with Google");
		} finally {
			setIsGoogleLoading(false);
		}
	}

	async function handleMicrosoftSignIn() {
		setIsMicrosoftLoading(true);
		try {
			const result = await signIn.social({
				provider: "microsoft",
				callbackURL: "/dashboard",
				errorCallbackURL: "/register",
			});
			if (result.error) {
				toast.error(result.error.message ?? "Failed to sign up with Microsoft");
			}
		} catch {
			toast.error("Failed to sign up with Microsoft");
		} finally {
			setIsMicrosoftLoading(false);
		}
	}

	async function onSubmit(data: RegisterInput) {
		setIsLoading(true);
		try {
			const result = await signUp.email({
				email: data.email,
				password: data.password,
				name: `${data.firstName} ${data.lastName}`,
				firstName: data.firstName,
				lastName: data.lastName,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Registration failed");
				return;
			}

			toast.success("Account created successfully!");
			router.push("/dashboard");
			router.refresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	const oauthLoaded = oauthSettings !== null;
	const anyOAuthDisabled = isLoading || isGoogleLoading || isMicrosoftLoading;
	const showGoogle = oauthSettings?.oauth_google_enabled && oauthAvailability?.google !== false;
	const showMicrosoft = oauthSettings?.oauth_microsoft_enabled && oauthAvailability?.microsoft === true;
	const hasOAuth = showGoogle || showMicrosoft;

	return (
		<div className="w-full max-w-md">
			<div className="flex flex-col items-center mb-8">
				<div className="text-primary">
					<AccessGroupLogo color="currentColor" className="h-10 w-auto" />
				</div>
				<h2 className="mt-8 text-center text-[2rem] leading-tight font-medium text-foreground tracking-tight">
					Register new account
				</h2>
				<p className="mt-2 text-center text-sm text-muted-foreground font-medium">
					Already have access?{" "}
					<Link
						href="/login"
						className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
					>
						Sign in here
					</Link>
				</p>
			</div>

			<div className="bg-card py-10 px-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] rounded-[2rem] sm:px-12 border border-gray-200/60 dark:border-white/10">
				<div className="space-y-6">
					{!oauthLoaded && (
						<div className="space-y-3">
							<div className="h-[52px] w-full animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
						</div>
					)}

					{oauthLoaded && hasOAuth && (
						<>
							<div className="space-y-3">
								{showGoogle && (
									<button
										type="button"
										onClick={handleGoogleSignIn}
										disabled={anyOAuthDisabled}
										className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-card px-4 py-3.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
									>
										{isGoogleLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<GoogleIcon />
										)}
										Continue with Google
									</button>
								)}

								{showMicrosoft && (
									<button
										type="button"
										onClick={handleMicrosoftSignIn}
										disabled={anyOAuthDisabled}
										className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-card px-4 py-3.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
									>
										{isMicrosoftLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<MicrosoftIcon />
										)}
										Continue with Microsoft
									</button>
								)}
							</div>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200 dark:border-white/10" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-card px-2 text-muted-foreground">
										Or continue with
									</span>
								</div>
							</div>
						</>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div className="grid grid-cols-2 gap-5">
							<div>
								<label htmlFor="firstName" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									First Name
								</label>
								<input id="firstName" type="text" className={inputClass} {...register("firstName")} />
								{errors.firstName && (
									<p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
								)}
							</div>
							<div>
								<label htmlFor="lastName" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
									Last Name
								</label>
								<input id="lastName" type="text" className={inputClass} {...register("lastName")} />
								{errors.lastName && (
									<p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
								)}
							</div>
						</div>

						<div>
							<label htmlFor="email" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
								Corporate Email
							</label>
							<input
								id="email"
								type="email"
								placeholder="name@accessgroup.com.au"
								className={inputClass}
								{...register("email")}
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
							)}
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
								Password
							</label>
							<div className="relative">
								<input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className={`${inputClass} pr-11`} {...register("password")} />
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

						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
								Confirm Password
							</label>
							<div className="relative">
								<input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className={`${inputClass} pr-11`} {...register("confirmPassword")} />
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

						<div className="pt-2">
							<button
								type="submit"
								disabled={isLoading || isGoogleLoading || isMicrosoftLoading}
								className="flex w-full justify-center rounded-full bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
							>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Register Account
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
