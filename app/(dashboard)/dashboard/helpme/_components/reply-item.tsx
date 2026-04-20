"use client";

import { Loader2, Pencil, ShieldCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteReplyAction, editReplyAction } from "@/lib/actions/helpme-actions";
import { RichTextEditor } from "./rich-text-editor";

export type ReplyItemData = {
	id: string;
	bodyHtml: string;
	createdAt: string;
	editedAt: string | null;
	canEdit: boolean;
	author: {
		displayName: string;
		avatar: string | null;
		isMaskedAdmin: boolean;
	};
};

function initials(name: string) {
	const parts = name.split(" ").filter(Boolean);
	return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatDateTime(iso: string) {
	return new Intl.DateTimeFormat("en-AU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}

export function ReplyItem({ reply }: { reply: ReplyItemData }) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(reply.bodyHtml);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleSave() {
		const stripped = draft.replace(/<[^>]*>/g, "").trim();
		if (stripped.length === 0) {
			toast.error("Reply cannot be empty");
			return;
		}
		setIsSaving(true);
		try {
			const result = await editReplyAction(reply.id, { bodyHtml: draft });
			if (!result.success) {
				const msg = typeof result.error === "string" ? result.error : "Failed to save";
				toast.error(msg);
				return;
			}
			toast.success("Reply updated");
			setIsEditing(false);
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete() {
		if (!window.confirm("Delete this reply?")) return;
		setIsDeleting(true);
		try {
			const result = await deleteReplyAction(reply.id);
			if (!result.success) {
				toast.error(typeof result.error === "string" ? result.error : "Failed to delete");
				return;
			}
			toast.success("Reply deleted");
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<div className="rounded-2xl border bg-card p-4">
			<div className="flex items-start gap-3">
				<Avatar author={reply.author} />
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">{reply.author.displayName}</span>
							<span className="text-xs text-muted-foreground">
								{formatDateTime(reply.createdAt)}
								{reply.editedAt && <span className="ml-1 italic">(edited)</span>}
							</span>
						</div>
						{reply.canEdit && !isEditing && (
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => setIsEditing(true)}
									aria-label="Edit reply"
									className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									<Pencil size={14} />
								</button>
								<button
									type="button"
									onClick={handleDelete}
									disabled={isDeleting}
									aria-label="Delete reply"
									className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
								>
									{isDeleting ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<Trash2 size={14} />
									)}
								</button>
							</div>
						)}
					</div>

					{isEditing ? (
						<div className="mt-3 space-y-2">
							<RichTextEditor value={draft} onChange={setDraft} disabled={isSaving} />
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => {
										setDraft(reply.bodyHtml);
										setIsEditing(false);
									}}
									className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
								>
									<X size={14} /> Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={isSaving}
									className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								>
									{isSaving && <Loader2 size={14} className="mr-1 animate-spin" />}
									Save
								</button>
							</div>
						</div>
					) : (
						<div
							className="prose prose-sm dark:prose-invert mt-2 max-w-none text-foreground/90"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: bodyHtml is sanitized server-side via sanitizeReplyHtml before storage
							dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

function Avatar({ author }: { author: ReplyItemData["author"] }) {
	if (author.isMaskedAdmin) {
		return (
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
				<ShieldCheck size={18} />
			</div>
		);
	}
	if (author.avatar) {
		return (
			// biome-ignore lint/performance/noImgElement: user avatars are arbitrary external URLs; next/image remote patterns not configured here
			<img
				src={author.avatar}
				alt={author.displayName}
				className="h-9 w-9 shrink-0 rounded-full object-cover"
			/>
		);
	}
	return (
		<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
			{initials(author.displayName) || "?"}
		</div>
	);
}
