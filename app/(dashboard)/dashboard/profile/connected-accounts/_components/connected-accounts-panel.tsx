"use client";

import { Link2, Loader2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { GoogleIcon, MicrosoftIcon } from "@/components/shared/oauth-icons";
import { linkSocial, unlinkAccount } from "@/lib/auth-client";

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
	google: <GoogleIcon className="h-5 w-5" />,
	microsoft: <MicrosoftIcon className="h-5 w-5" />,
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

	async function handleLink(providerId: string, providerName: string) {
		setLoadingProvider(providerId);
		try {
			const result = await linkSocial({
				provider: providerId as "google" | "microsoft",
				callbackURL: "/dashboard/profile/connected-accounts",
				errorCallbackURL: "/dashboard/profile/connected-accounts",
			});
			if (result.error) {
				toast.error(result.error.message ?? `Failed to link ${providerName} account`);
			} else {
				toast.success(`${providerName} account linked`);
				router.refresh();
			}
		} catch {
			toast.error(`Failed to link ${providerName} account`);
		} finally {
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
								<svg
									className="h-5 w-5 text-muted-foreground"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</div>
							<div>
								<p className="text-sm font-medium text-foreground">Email & Password</p>
								<p className="text-xs text-muted-foreground">
									Sign in with your email and password
								</p>
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
								onClick={() => handleLink(provider.id, provider.name)}
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
