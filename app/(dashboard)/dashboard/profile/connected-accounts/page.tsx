import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getOAuthProviderAvailability, getOAuthSettings } from "@/lib/actions/settings-actions";
import { ConnectedAccountsPanel } from "./_components/connected-accounts-panel";

export default async function ConnectedAccountsPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const [accounts, availability, settings] = await Promise.all([
		prisma.account.findMany({
			where: { userId: session.user.id },
			select: { providerId: true, accountId: true },
		}),
		getOAuthProviderAvailability(),
		getOAuthSettings(),
	]);

	const linkedProviders = accounts.map((a) => a.providerId);

	const providers = [
		{
			id: "google" as const,
			name: "Google",
			linked: linkedProviders.includes("google"),
			available: availability.google && settings.oauth_google_enabled,
		},
		{
			id: "microsoft" as const,
			name: "Microsoft",
			linked: linkedProviders.includes("microsoft"),
			available: availability.microsoft && settings.oauth_microsoft_enabled,
		},
	];

	const hasPassword = accounts.some((a) => a.providerId === "credential");

	return <ConnectedAccountsPanel providers={providers} hasPassword={hasPassword} />;
}
