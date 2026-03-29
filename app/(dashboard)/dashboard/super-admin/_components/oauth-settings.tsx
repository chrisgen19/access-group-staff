"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateOAuthSetting } from "@/lib/actions/settings-actions";
import type { OAuthSettings } from "@/lib/actions/settings-actions";
import { cn } from "@/lib/utils";

const PROVIDERS = [
	{
		key: "oauth_google_enabled" as const,
		name: "Google",
		description: "Allow users to sign in with their Google account",
		icon: (
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
		),
	},
	{
		key: "oauth_microsoft_enabled" as const,
		name: "Microsoft",
		description: "Allow users to sign in with their Microsoft account",
		icon: (
			<svg className="h-5 w-5" viewBox="0 0 23 23">
				<path fill="#f35325" d="M1 1h10v10H1z" />
				<path fill="#81bc06" d="M12 1h10v10H12z" />
				<path fill="#05a6f0" d="M1 12h10v10H1z" />
				<path fill="#ffba08" d="M12 12h10v10H12z" />
			</svg>
		),
	},
];

export function OAuthSettingsPanel({
	initialSettings,
}: {
	initialSettings: OAuthSettings;
}) {
	const [settings, setSettings] = useState(initialSettings);
	const [isPending, startTransition] = useTransition();
	const [pendingKey, setPendingKey] = useState<string | null>(null);

	function handleToggle(key: "oauth_google_enabled" | "oauth_microsoft_enabled", enabled: boolean) {
		setPendingKey(key);
		const previous = settings[key];

		setSettings((prev) => ({ ...prev, [key]: enabled }));

		startTransition(async () => {
			const result = await updateOAuthSetting(key, enabled);
			if (!result.success) {
				setSettings((prev) => ({ ...prev, [key]: previous }));
				toast.error(result.error ?? "Failed to update setting");
			} else {
				const providerName = key === "oauth_google_enabled" ? "Google" : "Microsoft";
				toast.success(`${providerName} OAuth ${enabled ? "enabled" : "disabled"}`);
			}
			setPendingKey(null);
		});
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					OAuth Providers
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Enable or disable social login providers on the sign-in page.
				</p>
			</div>

			<div className="px-8 py-6 space-y-4">
				{PROVIDERS.map((provider) => {
					const isEnabled = settings[provider.key];
					const isLoading = isPending && pendingKey === provider.key;

					return (
						<div
							key={provider.key}
							className={cn(
								"flex items-center justify-between rounded-2xl border p-5 transition-all duration-200",
								isEnabled
									? "border-primary/20 bg-primary/5"
									: "border-gray-200 dark:border-white/10",
							)}
						>
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
									{provider.icon}
								</div>
								<div>
									<p className="text-sm font-medium text-foreground">
										{provider.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{provider.description}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<span
									className={cn(
										"text-xs font-medium",
										isEnabled ? "text-primary" : "text-muted-foreground",
									)}
								>
									{isEnabled ? "Enabled" : "Disabled"}
								</span>
								<Switch
									checked={isEnabled}
									onCheckedChange={(checked) => handleToggle(provider.key, checked)}
									disabled={isLoading}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
