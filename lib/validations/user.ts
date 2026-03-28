import { z } from "zod";

export const createUserSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	displayName: z.string().optional(),
	phone: z.string().optional(),
	position: z.string().optional(),
	role: z.enum(["STAFF", "ADMIN", "SUPERADMIN"]),
	departmentId: z.string().nullable().optional(),
	isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.omit({ email: true, password: true }).partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
