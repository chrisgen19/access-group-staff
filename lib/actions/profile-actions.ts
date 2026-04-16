"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { deleteFromR2, extractKeyFromUrl } from "@/lib/r2";

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
