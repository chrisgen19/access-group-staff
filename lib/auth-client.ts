"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL,
	plugins: [
		inferAdditionalFields({
			user: {
				firstName: { type: "string", required: true },
				lastName: { type: "string", required: true },
				displayName: { type: "string", required: false },
				phone: { type: "string", required: false },
				position: { type: "string", required: false },
				avatar: { type: "string", required: false },
				role: { type: "string", required: false },
				isActive: { type: "boolean", required: false },
				departmentId: { type: "string", required: false },
			},
		}),
	],
});

export const { signIn, signUp, signOut, useSession, linkSocial, unlinkAccount } = authClient;
