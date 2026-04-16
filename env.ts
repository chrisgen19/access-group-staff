import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().url(),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
		MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
		MICROSOFT_TENANT_ID: z.string().min(1).optional(),
		RESEND_API_KEY: z.string().min(1).optional(),
		CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
		R2_ACCESS_KEY_ID: z.string().min(1).optional(),
		R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		R2_BUCKET_NAME: z.string().min(1).optional(),
		R2_PUBLIC_URL: z.string().url().optional(),
	},
	client: {
		NEXT_PUBLIC_APP_URL: z.string().url(),
	},
	experimental__runtimeEnv: {
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	},
});
