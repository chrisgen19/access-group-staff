import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { after } from "next/server";
import { env } from "@/env";
import { extractRequestMeta, logActivity } from "@/lib/activity-log";
import { mapGoogleProfile, mapMicrosoftProfile } from "@/lib/auth/profile-mappers";
import { prisma } from "@/lib/db";
import { syncMicrosoftAvatar } from "@/lib/microsoft-avatar";

const socialProviders: Record<string, unknown> = {
	google: {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		mapProfileToUser: mapGoogleProfile,
	},
};

if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
	socialProviders.microsoft = {
		clientId: env.MICROSOFT_CLIENT_ID,
		clientSecret: env.MICROSOFT_CLIENT_SECRET,
		tenantId: env.MICROSOFT_TENANT_ID ?? "common",
		scope: ["User.Read", "openid", "profile", "email"],
		mapProfileToUser: mapMicrosoftProfile,
	};
}

const isE2E = process.env.E2E_TEST === "true" && env.BETTER_AUTH_URL.startsWith("http://localhost");

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
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			const headers = ctx.request?.headers ?? ctx.headers ?? new Headers();
			const { ipAddress, userAgent } = extractRequestMeta(headers);
			const returned = ctx.context?.returned;
			const isError = returned instanceof Response && !returned.ok;
			const actorId = ctx.context?.session?.user?.id ?? null;
			const bodyEmail =
				typeof ctx.body === "object" && ctx.body && "email" in ctx.body
					? String((ctx.body as { email?: unknown }).email ?? "")
					: null;

			switch (ctx.path) {
				case "/sign-in/email":
					if (isError) {
						await logActivity({
							action: "SIGN_IN_FAILED",
							metadata: bodyEmail ? { email: bodyEmail } : undefined,
							ipAddress,
							userAgent,
						});
					}
					break;
				case "/sign-out":
					if (!isError && actorId) {
						await logActivity({
							action: "USER_SIGNED_OUT",
							actorId,
							ipAddress,
							userAgent,
						});
					}
					break;
				case "/change-password":
					if (!isError && actorId) {
						await logActivity({
							action: "PASSWORD_CHANGED",
							actorId,
							ipAddress,
							userAgent,
						});
					}
					break;
				case "/reset-password":
					if (!isError) {
						await logActivity({
							action: "PASSWORD_RESET",
							metadata: bodyEmail ? { email: bodyEmail } : undefined,
							ipAddress,
							userAgent,
						});
					}
					break;
			}
		}),
	},
	databaseHooks: {
		session: {
			create: {
				after: async (session) => {
					await logActivity({
						action: "USER_SIGNED_IN",
						actorId: session.userId,
						ipAddress: session.ipAddress ?? null,
						userAgent: session.userAgent ?? null,
					});
				},
			},
		},
		account: {
			create: {
				after: async (account) => {
					if (account.providerId === "google" || account.providerId === "microsoft") {
						await logActivity({
							action: "OAUTH_ACCOUNT_LINKED",
							actorId: account.userId,
							targetType: "provider",
							targetId: account.providerId,
						});
					}

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
