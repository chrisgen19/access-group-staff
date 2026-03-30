"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { AccessGroupLogo } from "@/components/shared/access-logos";
import type { OAuthSettings } from "@/lib/actions/settings-actions";

const GOOGLE_ICON = (
	<svg className="h-4 w-4" viewBox="0 0 24 24">
		<path
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
			fill="#4285F4"
		/>
		<path
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			fill="#34A853"
		/>
		<path
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			fill="#FBBC05"
		/>
		<path
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			fill="#EA4335"
		/>
	</svg>
);

const MICROSOFT_ICON = (
	<svg className="h-4 w-4" viewBox="0 0 23 23">
		<path fill="#f35325" d="M1 1h10v10H1z" />
		<path fill="#81bc06" d="M12 1h10v10H12z" />
		<path fill="#05a6f0" d="M1 12h10v10H1z" />
		<path fill="#ffba08" d="M12 12h10v10H12z" />
	</svg>
);

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
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

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
	});

	async function onSubmit(data: LoginInput) {
		setIsLoading(true);
		try {
			const result = await signIn.email({
				email: data.email,
				password: data.password,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Invalid email or password");
				return;
			}

			router.push(callbackUrl);
			router.refresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleGoogleSignIn() {
		setIsGoogleLoading(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: callbackUrl,
			});
		} catch {
			toast.error("Failed to sign in with Google");
			setIsGoogleLoading(false);
		}
	}

	async function handleMicrosoftSignIn() {
		setIsMicrosoftLoading(true);
		try {
			await signIn.social({
				provider: "microsoft",
				callbackURL: callbackUrl,
			});
		} catch {
			toast.error("Failed to sign in with Microsoft");
			setIsMicrosoftLoading(false);
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
					Welcome back
				</h2>
				<p className="mt-2 text-center text-sm text-muted-foreground font-medium">
					Or{" "}
					<Link
						href="/register"
						className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
					>
						create a new account
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
											GOOGLE_ICON
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
											MICROSOFT_ICON
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
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Corporate Email
							</label>
							<input
								id="email"
								type="email"
								placeholder="name@accessgroup.com.au"
								className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200"
								{...register("email")}
							/>
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
									placeholder="••••••••"
									className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200"
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

						<div className="pt-2">
							<button
								type="submit"
								disabled={isLoading || isGoogleLoading || isMicrosoftLoading}
								className="flex w-full justify-center rounded-full bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
							>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Sign in
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
