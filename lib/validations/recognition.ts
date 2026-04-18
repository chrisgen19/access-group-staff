import { z } from "zod";

export const createRecognitionCardSchema = z
	.object({
		recipientId: z.string().min(1, "Recipient is required"),
		message: z
			.string()
			.min(1, "Message is required")
			.max(500, "Message must be 500 characters or less"),
		date: z.string().min(1, "Date is required"),
		valuesPeople: z.boolean(),
		valuesSafety: z.boolean(),
		valuesRespect: z.boolean(),
		valuesCommunication: z.boolean(),
		valuesContinuousImprovement: z.boolean(),
	})
	.refine(
		(data) =>
			data.valuesPeople ||
			data.valuesSafety ||
			data.valuesRespect ||
			data.valuesCommunication ||
			data.valuesContinuousImprovement,
		{
			message: "At least one company value must be selected",
			path: ["valuesPeople"],
		},
	);

export type CreateRecognitionCardInput = z.infer<typeof createRecognitionCardSchema>;
