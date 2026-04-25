"use server";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { extractRequestMeta, logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { deleteFromR2, extractKeyFromUrl } from "@/lib/r2";
import { setPasswordSchema } from "@/lib/validations/auth";

const updateProfileSchema = z.object({
	displayName: z.string().optional(),
	phone: z.string().optional(),
	position: z.string().optional(),
	branch: z.enum(["ISO", "PERTH"]).nullable().optional(),
	firstName: z.string().min(1, "First name is required").optional(),
	lastName: z.string().min(1, "Last name is required").optional(),
});

/** Removes the user's avatar — deletes from R2 if applicable, clears DB. */
export async function removeAvatarAction() {
	try {
		const session = await requireSession();

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { avatar: true },
		});

		// Clear DB first so a failed R2 delete never leaves a broken avatar link
		await prisma.user.update({
			where: { id: session.user.id },
			data: { avatar: null },
		});

		if (user?.avatar) {
			const key = extractKeyFromUrl(user.avatar);
			if (key) {
				await deleteFromR2(key).catch(() => {});
			}
		}

		revalidatePath("/dashboard");
		return { success: true as const, data: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to remove photo";
		return { success: false as const, error: message };
	}
}

export async function updateProfileAction(formData: unknown) {
	try {
		const session = await requireSession();
		const parsed = updateProfileSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const updated = await prisma.user.update({
			where: { id: session.user.id },
			data: {
				...parsed.data,
				name:
					parsed.data.firstName && parsed.data.lastName
						? `${parsed.data.firstName} ${parsed.data.lastName}`
						: undefined,
			},
		});

		revalidatePath("/dashboard/profile");
		return { success: true as const, data: updated };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to update profile";
		return { success: false as const, error: message };
	}
}

export async function setInitialPasswordAction(formData: unknown) {
	try {
		const session = await requireSession();
		const parsed = setPasswordSchema.safeParse(formData);

		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const existing = await prisma.account.findFirst({
			where: { userId: session.user.id, providerId: "credential" },
			select: { id: true },
		});

		if (existing) {
			return {
				success: false as const,
				error: "A password is already set for this account. Use change password instead.",
			};
		}

		const hashedPassword = await hashPassword(parsed.data.newPassword);

		// `accountId === userId` for credential accounts — matches better-auth's
		// internal linkAccount call so subsequent sign-in flows treat it
		// identically to a credential account created at registration.
		await prisma.account.create({
			data: {
				userId: session.user.id,
				accountId: session.user.id,
				providerId: "credential",
				password: hashedPassword,
			},
		});

		const { ipAddress, userAgent } = extractRequestMeta(await headers());
		await logActivity({
			action: "PASSWORD_SET",
			actorId: session.user.id,
			ipAddress,
			userAgent,
		});

		revalidatePath("/dashboard/profile/security");
		revalidatePath("/dashboard/profile/connected-accounts");
		return { success: true as const, data: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to set password";
		return { success: false as const, error: message };
	}
}
