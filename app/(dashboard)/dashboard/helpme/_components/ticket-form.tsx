"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTicketAction } from "@/lib/actions/helpme-actions";
import {
	type CreateTicketInput,
	createTicketSchema,
	TICKET_CATEGORIES,
} from "@/lib/validations/helpme";
import { RichTextEditor } from "./rich-text-editor";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

export function TicketForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<CreateTicketInput>({
		resolver: zodResolver(createTicketSchema),
		defaultValues: { subject: "", body: "", category: "HR" },
	});

	async function onSubmit(data: CreateTicketInput) {
		setIsLoading(true);
		try {
			const result = await createTicketAction(data);
			if (!result.success) {
				const msg = typeof result.error === "string" ? result.error : "Validation failed";
				toast.error(msg);
				return;
			}
			toast.success("Ticket submitted");
			router.push(`/dashboard/helpme/${result.data.id}`);
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-5 rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]"
		>
			<div>
				<label
					htmlFor="ticket-category"
					className="mb-1.5 ml-1 block text-sm font-medium text-foreground/70"
				>
					Category
				</label>
				<select id="ticket-category" className={inputClass} {...register("category")}>
					{TICKET_CATEGORIES.map((c) => (
						<option key={c.value} value={c.value}>
							{c.label}
						</option>
					))}
				</select>
				{errors.category && (
					<p className="mt-1 text-sm text-destructive">{errors.category.message}</p>
				)}
			</div>

			<div>
				<label
					htmlFor="ticket-subject"
					className="mb-1.5 ml-1 block text-sm font-medium text-foreground/70"
				>
					Subject
				</label>
				<input
					id="ticket-subject"
					placeholder="Short summary of the issue"
					className={inputClass}
					{...register("subject")}
				/>
				{errors.subject && (
					<p className="mt-1 text-sm text-destructive">{errors.subject.message}</p>
				)}
			</div>

			<div>
				<span className="mb-1.5 ml-1 block text-sm font-medium text-foreground/70">
					Description
				</span>
				<Controller
					control={control}
					name="body"
					render={({ field }) => (
						<RichTextEditor
							value={field.value}
							onChange={field.onChange}
							placeholder="Please describe the issue in detail..."
							disabled={isLoading}
						/>
					)}
				/>
				{errors.body && <p className="mt-1 text-sm text-destructive">{errors.body.message}</p>}
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onClick={() => router.back()}
					className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isLoading}
					className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
				>
					{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Submit Ticket
				</button>
			</div>
		</form>
	);
}
