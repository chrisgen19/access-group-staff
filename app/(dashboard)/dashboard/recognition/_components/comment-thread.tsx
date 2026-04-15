"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import type { CardComment } from "@/lib/recognition";
import {
	addCommentAction,
	editCommentAction,
	deleteCommentAction,
} from "@/lib/actions/interaction-actions";

function timeAgo(dateString: string) {
	const diff = Date.now() - new Date(dateString).getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(dateString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

interface CommentItemProps {
	comment: CardComment;
	currentUserId: string;
	isAdmin: boolean;
	onEdit: (updated: CardComment) => void;
	onDelete: (commentId: string) => void;
}

function CommentItem({
	comment,
	currentUserId,
	isAdmin,
	onEdit,
	onDelete,
}: CommentItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(comment.body);
	const [isPending, startTransition] = useTransition();

	const isOwner = comment.userId === currentUserId;
	const canEdit = isOwner;
	const canDelete = isOwner || isAdmin;

	function handleSaveEdit() {
		if (!editValue.trim() || editValue.trim() === comment.body) {
			setIsEditing(false);
			return;
		}
		startTransition(async () => {
			const result = await editCommentAction(comment.id, editValue.trim());
			if (result.success) {
				onEdit({
					...comment,
					body: result.data.body,
					updatedAt: result.data.updatedAt.toISOString(),
				});
				setIsEditing(false);
			} else {
				toast.error(result.error);
			}
		});
	}

	function handleDelete() {
		startTransition(async () => {
			const result = await deleteCommentAction(comment.id);
			if (result.success) {
				onDelete(comment.id);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="flex gap-2.5 group/comment">
			<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
				{getInitials(comment.user.firstName, comment.user.lastName)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="rounded-2xl rounded-tl-sm bg-muted/60 dark:bg-white/5 px-3 py-2">
					<div className="flex items-baseline gap-1.5 mb-0.5">
						<span className="text-xs font-semibold text-foreground">
							{comment.user.firstName} {comment.user.lastName}
						</span>
						{comment.user.position && (
							<span className="text-[10px] text-muted-foreground truncate">
								· {comment.user.position}
							</span>
						)}
					</div>
					{isEditing ? (
						<div className="flex gap-1.5 items-end">
							<textarea
								value={editValue}
								onChange={(e) => setEditValue(e.target.value)}
								maxLength={500}
								rows={2}
								disabled={isPending}
								className="flex-1 resize-none text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
								// biome-ignore lint/a11y/noAutofocus: intentional focus on edit mode
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSaveEdit();
									}
									if (e.key === "Escape") {
										setIsEditing(false);
										setEditValue(comment.body);
									}
								}}
							/>
							<div className="flex gap-1 shrink-0">
								<button
									type="button"
									onClick={handleSaveEdit}
									disabled={isPending}
									className="rounded-full p-1 text-primary hover:bg-primary/10 transition-colors"
									aria-label="Save edit"
								>
									<Check size={13} />
								</button>
								<button
									type="button"
									onClick={() => {
										setIsEditing(false);
										setEditValue(comment.body);
									}}
									className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
									aria-label="Cancel edit"
								>
									<X size={13} />
								</button>
							</div>
						</div>
					) : (
						<p className="text-sm text-foreground/80 leading-relaxed break-words">
							{comment.body}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2 mt-0.5 px-1">
					<span className="text-[10px] text-muted-foreground">
						{timeAgo(comment.createdAt)}
						{comment.updatedAt !== comment.createdAt && " · edited"}
					</span>
					{!isEditing && (canEdit || canDelete) && (
						<div className="flex gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
							{canEdit && (
								<button
									type="button"
									onClick={() => setIsEditing(true)}
									className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
								>
									<Pencil size={11} />
								</button>
							)}
							{canDelete && (
								<button
									type="button"
									onClick={handleDelete}
									disabled={isPending}
									className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
								>
									<Trash2 size={11} />
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

interface CommentThreadProps {
	cardId: string;
	comments: CardComment[];
	currentUserId: string;
	isAdmin: boolean;
	onCommentsChange: (comments: CardComment[]) => void;
}

export function CommentThread({
	cardId,
	comments,
	currentUserId,
	isAdmin,
	onCommentsChange,
}: CommentThreadProps) {
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleSubmit() {
		const trimmed = input.trim();
		if (!trimmed) return;

		startTransition(async () => {
			const result = await addCommentAction(cardId, trimmed);
			if (result.success) {
				onCommentsChange([
					...comments,
					{
						...result.data,
						createdAt: result.data.createdAt.toISOString(),
						updatedAt: result.data.updatedAt.toISOString(),
					},
				]);
				setInput("");
			} else {
				toast.error(result.error);
			}
		});
	}

	function handleEdit(updated: CardComment) {
		onCommentsChange(
			comments.map((c) => (c.id === updated.id ? updated : c)),
		);
	}

	function handleDelete(commentId: string) {
		onCommentsChange(comments.filter((c) => c.id !== commentId));
	}

	return (
		<div className="space-y-2.5 pt-2">
			{comments.map((comment) => (
				<CommentItem
					key={comment.id}
					comment={comment}
					currentUserId={currentUserId}
					isAdmin={isAdmin}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			))}

			{/* Comment input */}
			<div className="flex gap-2.5 items-end">
				<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
					Me
				</div>
				<div
					className={cn(
						"flex flex-1 items-end gap-2 rounded-2xl rounded-bl-sm border border-border/60 bg-muted/40 dark:bg-white/5 px-3 py-2 transition-colors",
						"focus-within:border-primary/40 focus-within:bg-background",
					)}
				>
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Write a comment…"
						maxLength={500}
						rows={1}
						disabled={isPending}
						className="flex-1 resize-none bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground leading-relaxed"
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit();
							}
						}}
					/>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!input.trim() || isPending}
						className="shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
					>
						Post
					</button>
				</div>
			</div>
		</div>
	);
}
