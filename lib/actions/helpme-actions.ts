"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/app/generated/prisma/client";
import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import { logActivityForRequest } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";
import { sanitizeReplyHtml } from "@/lib/sanitize-html";
import { createTicketSchema, replySchema } from "@/lib/validations/helpme";

const MODULE_DISABLED_ERROR = "Help Me module is disabled";

export async function createTicketAction(formData: unknown) {
	try {
		if (!(await getHelpMeEnabled())) {
			return { success: false as const, error: MODULE_DISABLED_ERROR };
		}
		const session = await requireSession();
		const parsed = createTicketSchema.safeParse(formData);

		if (!parsed.success) {
			return {
				success: false as const,
				error: parsed.error.flatten().fieldErrors,
			};
		}

		const sanitizedBody = sanitizeReplyHtml(parsed.data.body);
		if (sanitizedBody.length === 0) {
			return { success: false as const, error: "Description cannot be empty" };
		}

		const ticket = await prisma.helpMeTicket.create({
			data: {
				subject: parsed.data.subject,
				category: parsed.data.category,
				body: sanitizedBody,
				createdById: session.user.id,
			},
			select: { id: true },
		});

		await logActivityForRequest({
			action: "TICKET_CREATED",
			actorId: session.user.id,
			targetType: "help_me_ticket",
			targetId: ticket.id,
			metadata: { category: parsed.data.category },
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

	if (!(await getHelpMeEnabled())) {
		return { tickets: [], isAdmin };
	}

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

	if (!(await getHelpMeEnabled())) return null;

	const ticket = await prisma.helpMeTicket.findFirst({
		where: isAdmin ? { id } : { id, createdById: session.user.id },
		include: {
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					role: true,
				},
			},
			replies: {
				orderBy: { createdAt: "asc" },
				include: {
					author: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							avatar: true,
							role: true,
						},
					},
				},
			},
		},
	});

	return ticket;
}

async function loadTicketForAccess(ticketId: string, userId: string, isAdmin: boolean) {
	return prisma.helpMeTicket.findFirst({
		where: isAdmin ? { id: ticketId } : { id: ticketId, createdById: userId },
		select: { id: true, status: true },
	});
}

export async function replyToTicketAction(ticketId: string, formData: unknown) {
	try {
		if (!(await getHelpMeEnabled())) {
			return { success: false as const, error: MODULE_DISABLED_ERROR };
		}
		const session = await requireSession();
		const role = session.user.role as Role;
		const isAdmin = hasMinRole(role, "ADMIN");

		const parsed = replySchema.safeParse(formData);
		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const ticket = await loadTicketForAccess(ticketId, session.user.id, isAdmin);
		if (!ticket) {
			return { success: false as const, error: "Ticket not found" };
		}
		if (ticket.status === "CLOSED") {
			return { success: false as const, error: "This ticket is closed" };
		}

		const sanitized = sanitizeReplyHtml(parsed.data.bodyHtml);
		if (sanitized.length === 0) {
			return { success: false as const, error: "Reply cannot be empty" };
		}

		const reply = await prisma.ticketReply.create({
			data: {
				ticketId,
				authorId: session.user.id,
				bodyHtml: sanitized,
			},
			select: { id: true },
		});

		await logActivityForRequest({
			action: "TICKET_REPLIED",
			actorId: session.user.id,
			targetType: "help_me_ticket",
			targetId: ticketId,
			metadata: { replyId: reply.id },
		});

		revalidatePath(`/dashboard/helpme/${ticketId}`);
		revalidatePath("/dashboard/helpme");
		return { success: true as const, data: reply };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to post reply";
		return { success: false as const, error: message };
	}
}

export async function editReplyAction(replyId: string, formData: unknown) {
	try {
		if (!(await getHelpMeEnabled())) {
			return { success: false as const, error: MODULE_DISABLED_ERROR };
		}
		const session = await requireSession();
		const parsed = replySchema.safeParse(formData);
		if (!parsed.success) {
			return { success: false as const, error: parsed.error.flatten().fieldErrors };
		}

		const existing = await prisma.ticketReply.findUnique({
			where: { id: replyId },
			select: { authorId: true, ticketId: true },
		});
		if (!existing) return { success: false as const, error: "Reply not found" };
		if (existing.authorId !== session.user.id) {
			return { success: false as const, error: "You can only edit your own replies" };
		}

		const sanitized = sanitizeReplyHtml(parsed.data.bodyHtml);
		if (sanitized.length === 0) {
			return { success: false as const, error: "Reply cannot be empty" };
		}

		await prisma.ticketReply.update({
			where: { id: replyId },
			data: { bodyHtml: sanitized, editedAt: new Date() },
		});

		revalidatePath(`/dashboard/helpme/${existing.ticketId}`);
		return { success: true as const };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to edit reply";
		return { success: false as const, error: message };
	}
}

export async function deleteReplyAction(replyId: string) {
	try {
		if (!(await getHelpMeEnabled())) {
			return { success: false as const, error: MODULE_DISABLED_ERROR };
		}
		const session = await requireSession();
		const existing = await prisma.ticketReply.findUnique({
			where: { id: replyId },
			select: { authorId: true, ticketId: true },
		});
		if (!existing) return { success: false as const, error: "Reply not found" };
		if (existing.authorId !== session.user.id) {
			return { success: false as const, error: "You can only delete your own replies" };
		}

		await prisma.ticketReply.delete({ where: { id: replyId } });
		revalidatePath(`/dashboard/helpme/${existing.ticketId}`);
		return { success: true as const };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to delete reply";
		return { success: false as const, error: message };
	}
}
