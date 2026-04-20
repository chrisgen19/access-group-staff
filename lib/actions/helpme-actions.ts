"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/app/generated/prisma/client";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";
import { createTicketSchema } from "@/lib/validations/helpme";

export async function createTicketAction(formData: unknown) {
	try {
		const session = await requireSession();
		const parsed = createTicketSchema.safeParse(formData);

		if (!parsed.success) {
			return {
				success: false as const,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		const ticket = await prisma.helpMeTicket.create({
			data: {
				...parsed.data,
				createdById: session.user.id,
			},
			select: { id: true },
		});

		revalidatePath("/dashboard/helpme");
		return { success: true as const, data: ticket };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to create ticket";
		return { success: false as const, error: message };
	}
}

export async function listTicketsForCurrentUser() {
	const session = await requireSession();
	const role = session.user.role as Role;
	const isAdmin = hasMinRole(role, "ADMIN");

	const tickets = await prisma.helpMeTicket.findMany({
		where: isAdmin ? undefined : { createdById: session.user.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			subject: true,
			category: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
				},
			},
			_count: { select: { replies: true } },
		},
	});

	return { tickets, isAdmin };
}

export async function getTicketByIdForCurrentUser(id: string) {
	const session = await requireSession();
	const role = session.user.role as Role;
	const isAdmin = hasMinRole(role, "ADMIN");

	const ticket = await prisma.helpMeTicket.findFirst({
		where: isAdmin ? { id } : { id, createdById: session.user.id },
		include: {
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
				},
			},
		},
	});

	return ticket;
}
