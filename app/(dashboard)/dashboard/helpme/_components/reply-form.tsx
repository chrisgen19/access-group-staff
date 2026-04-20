"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { replyToTicketAction } from "@/lib/actions/helpme-actions";
import { RichTextEditor } from "./rich-text-editor";

export function ReplyForm({ ticketId }: { ticketId: string }) {
	const router = useRouter();
	const [html, setHtml] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit() {
		const stripped = html.replace(/<[^>]*>/g, "").trim();
		if (stripped.length === 0) {
			toast.error("Reply cannot be empty");
			return;
		}
		setIsSubmitting(true);
		try {
			const result = await replyToTicketAction(ticketId, { bodyHtml: html });
			if (!result.success) {
				const msg = typeof result.error === "string" ? result.error : "Failed to post reply";
				toast.error(msg);
				return;
			}
			setHtml("");
			toast.success("Reply posted");
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-3">
			<RichTextEditor
				value={html}
				onChange={setHtml}
				placeholder="Write your reply..."
				disabled={isSubmitting}
			/>
			<div className="flex justify-end">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
				>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Post Reply
				</button>
			</div>
		</div>
	);
}
