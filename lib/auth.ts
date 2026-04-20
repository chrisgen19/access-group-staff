import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
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

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
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
					void syncMicrosoftAvatar(userId, accessToken).catch((err) => {
						console.error("Microsoft avatar sync failed", {
							userId,
							error: err instanceof Error ? err.message : String(err),
						});
					});
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
