import { z } from "zod";

export const departmentSchema = z.object({
	name: z.string().min(1, "Department name is required"),
	code: z
		.string()
		.min(1, "Department code is required")
		.max(10, "Code must be 10 characters or less")
		.transform((val) => val.toUpperCase()),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
