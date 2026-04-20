import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { after } from "next/server";
import { env } from "@/env";
import { prisma } from "@/lib/db";
import { syncMicrosoftAvatar } from "@/lib/microsoft-avatar";

const socialProviders: Record<string, unknown> = {
	google: {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		mapProfileToUser: (profile: { given_name: string; family_name: string }) => ({
			firstName: profile.given_name,
			lastName: profile.family_name,
			name: `${profile.given_name} ${profile.family_name}`,
		}),
	},
};

if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
	socialProviders.microsoft = {
		clientId: env.MICROSOFT_CLIENT_ID,
		clientSecret: env.MICROSOFT_CLIENT_SECRET,
		tenantId: env.MICROSOFT_TENANT_ID ?? "common",
		scope: ["User.Read", "openid", "profile", "email"],
		mapProfileToUser: (profile: { given_name: string; family_name: string }) => ({
			firstName: profile.given_name,
			lastName: profile.family_name,
			name: `${profile.given_name} ${profile.family_name}`,
		}),
	};
}

const isE2E = process.env.E2E_TEST === "true";

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	rateLimit: {
		enabled: !isE2E,
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders,
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "microsoft"],
		},
	},
	databaseHooks: {
		account: {
			create: {
				after: async (account) => {
					if (account.providerId !== "microsoft" || !account.accessToken) return;
					const { userId, accessToken } = account;
					const run = () =>
						syncMicrosoftAvatar(userId, accessToken).catch((err) => {
							console.error("Microsoft avatar sync failed", {
								userId,
								error: err instanceof Error ? err.message : String(err),
							});
						});
					// next/server `after` uses Vercel's waitUntil so the serverless
					// invocation stays alive until the sync completes. Falls back to
					// awaiting inline when called outside a request (e.g. seed scripts).
					try {
						after(run);
					} catch {
						await run();
					}
				},
			},
		},
	},
	user: {
		additionalFields: {
			firstName: {
				type: "string",
				required: true,
				input: true,
			},
			lastName: {
				type: "string",
				required: true,
				input: true,
			},
			displayName: {
				type: "string",
				required: false,
				input: true,
			},
			phone: {
				type: "string",
				required: false,
				input: true,
			},
			position: {
				type: "string",
				required: false,
				input: true,
			},
			avatar: {
				type: "string",
				required: false,
				input: true,
			},
			role: {
				type: "string",
				defaultValue: "STAFF",
				input: false,
			},
			departmentId: {
				type: "string",
				required: false,
				input: false,
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
