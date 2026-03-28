"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
	displayName: z.string().optional(),
	phone: z.string().optional(),
	position: z.string().optional(),
	firstName: z.string().min(1, "First name is required").optional(),
	lastName: z.string().min(1, "Last name is required").optional(),
});

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
