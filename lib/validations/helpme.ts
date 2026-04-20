import { z } from "zod";

export const TICKET_CATEGORIES = [
	{ value: "HR", label: "HR" },
	{ value: "IT_WEBSITE", label: "IT / Website" },
	{ value: "FACILITIES", label: "Facilities" },
	{ value: "OTHER", label: "Other" },
] as const;

export const createTicketSchema = z.object({
	subject: z
		.string()
		.trim()
		.min(3, "Subject must be at least 3 characters")
		.max(120, "Subject must be 120 characters or less"),
	body: z
		.string()
		.trim()
		.min(10, "Please describe the issue (at least 10 characters)")
		.max(5000, "Description must be 5000 characters or less"),
	category: z.enum(["HR", "IT_WEBSITE", "FACILITIES", "OTHER"]),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
