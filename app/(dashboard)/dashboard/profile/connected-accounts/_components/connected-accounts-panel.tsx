"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Link2, Unlink } from "lucide-react";
import { linkSocial, unlinkAccount } from "@/lib/auth-client";

const GOOGLE_ICON = (
	<svg className="h-5 w-5" viewBox="0 0 24 24">
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
	<svg className="h-5 w-5" viewBox="0 0 23 23">
		<path fill="#f35325" d="M1 1h10v10H1z" />
		<path fill="#81bc06" d="M12 1h10v10H12z" />
		<path fill="#05a6f0" d="M1 12h10v10H1z" />
		<path fill="#ffba08" d="M12 12h10v10H12z" />
	</svg>
);

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
	google: GOOGLE_ICON,
	microsoft: MICROSOFT_ICON,
};

interface Provider {
	id: "google" | "microsoft";
	name: string;
	linked: boolean;
	available: boolean;
}

interface ConnectedAccountsPanelProps {
	providers: Provider[];
	hasPassword: boolean;
}

export function ConnectedAccountsPanel({ providers, hasPassword }: ConnectedAccountsPanelProps) {
	const router = useRouter();
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

	const linkedCount = providers.filter((p) => p.linked).length;
	const totalLinked = linkedCount + (hasPassword ? 1 : 0);

	async function handleLink(providerId: string) {
		setLoadingProvider(providerId);
		try {
			await linkSocial({
				provider: providerId as "google" | "microsoft",
				callbackURL: "/dashboard/profile/connected-accounts",
			});
		} catch {
			toast.error(`Failed to link ${providerId} account`);
			setLoadingProvider(null);
		}
	}

	async function handleUnlink(providerId: string, providerName: string) {
		if (totalLinked <= 1) {
			toast.error("You must have at least one login method");
			return;
		}

		setLoadingProvider(providerId);
		try {
			const result = await unlinkAccount({ providerId });
			if (result.error) {
				toast.error(result.error.message ?? `Failed to unlink ${providerName}`);
			} else {
				toast.success(`${providerName} account disconnected`);
				router.refresh();
			}
		} catch {
			toast.error(`Failed to unlink ${providerName}`);
		} finally {
			setLoadingProvider(null);
		}
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Connected Accounts
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Link your social accounts for easier sign-in
				</p>
			</div>

			<div className="px-8 py-6 space-y-3">
				{hasPassword && (
					<div className="flex items-center justify-between rounded-2xl border border-gray-200/60 dark:border-white/10 px-5 py-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
								<svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</div>
							<div>
								<p className="text-sm font-medium text-foreground">Email & Password</p>
								<p className="text-xs text-muted-foreground">Sign in with your email and password</p>
							</div>
						</div>
						<span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
							Active
						</span>
					</div>
				)}

				{providers.map((provider) => (
					<div
						key={provider.id}
						className="flex items-center justify-between rounded-2xl border border-gray-200/60 dark:border-white/10 px-5 py-4"
					>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
								{PROVIDER_ICONS[provider.id]}
							</div>
							<div>
								<p className="text-sm font-medium text-foreground">{provider.name}</p>
								<p className="text-xs text-muted-foreground">
									{provider.linked
										? `Your ${provider.name} account is connected`
										: `Sign in with your ${provider.name} account`}
								</p>
							</div>
						</div>

						{provider.linked ? (
							<button
								type="button"
								onClick={() => handleUnlink(provider.id, provider.name)}
								disabled={loadingProvider !== null}
								className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all duration-200 disabled:opacity-50"
							>
								{loadingProvider === provider.id ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Unlink className="h-3.5 w-3.5" />
								)}
								Disconnect
							</button>
						) : provider.available ? (
							<button
								type="button"
								onClick={() => handleLink(provider.id)}
								disabled={loadingProvider !== null}
								className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
							>
								{loadingProvider === provider.id ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Link2 className="h-3.5 w-3.5" />
								)}
								Connect
							</button>
						) : (
							<span className="text-xs text-muted-foreground">Not available</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
