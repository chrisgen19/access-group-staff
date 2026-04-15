"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	REACTION_EMOJIS,
	type CardInteractions,
	type CardComment,
} from "@/lib/recognition";
import { toggleReactionAction } from "@/lib/actions/interaction-actions";
import { CommentThread } from "./comment-thread";

interface CardInteractionBarProps {
	cardId: string;
	currentUserId: string;
	isAdmin: boolean;
}

export function CardInteractionBar({
	cardId,
	currentUserId,
	isAdmin,
}: CardInteractionBarProps) {
	const queryClient = useQueryClient();
	const [showComments, setShowComments] = useState(false);

	const { data, isLoading } = useQuery<{ success: boolean; data: CardInteractions }>({
		queryKey: ["card-interactions", cardId],
		queryFn: async () => {
			const res = await fetch(`/api/recognition/${cardId}/interactions`);
			if (!res.ok) throw new Error("Failed to fetch interactions");
			return res.json();
		},
		staleTime: 30_000,
	});

	const interactions = data?.data;

	function handleReaction(emoji: string) {
		const current = interactions;
		if (!current) return;

		// Optimistic update
		queryClient.setQueryData<{ success: boolean; data: CardInteractions }>(
			["card-interactions", cardId],
			(old) => {
				if (!old?.data) return old;
				const reactions = old.data.reactions.map((r) => {
					if (r.emoji !== emoji) return r;
					const adding = !r.hasReacted;
					return {
						...r,
						count: adding ? r.count + 1 : r.count - 1,
						hasReacted: adding,
					};
				});
				return { ...old, data: { ...old.data, reactions } };
			},
		);

		toggleReactionAction(cardId, emoji).then((result) => {
			if (!result.success) {
				// Revert on failure
				queryClient.invalidateQueries({ queryKey: ["card-interactions", cardId] });
				toast.error(result.error);
			}
		});
	}

	function handleCommentsChange(comments: CardComment[]) {
		queryClient.setQueryData<{ success: boolean; data: CardInteractions }>(
			["card-interactions", cardId],
			(old) => {
				if (!old?.data) return old;
				return {
					...old,
					data: { ...old.data, comments, totalComments: comments.length },
				};
			},
		);
	}

	if (isLoading) {
		return (
			<div className="flex gap-1.5 pt-3 mt-3 border-t border-border/50">
				{REACTION_EMOJIS.map((emoji) => (
					<div
						key={emoji}
						className="h-7 w-10 rounded-full bg-muted/60 animate-pulse"
					/>
				))}
			</div>
		);
	}

	const reactions = interactions?.reactions ?? [];
	const comments = interactions?.comments ?? [];
	const totalComments = interactions?.totalComments ?? 0;

	const activeReactions = reactions.filter((r) => r.count > 0);
	const inactiveReactions = reactions.filter((r) => r.count === 0);

	return (
		<div className="pt-3 mt-3 border-t border-border/50">
			{/* Reaction row */}
			<div className="flex flex-wrap items-center gap-1.5">
				{/* Active reactions first */}
				{activeReactions.map((r) => (
					<button
						key={r.emoji}
						type="button"
						onClick={() => handleReaction(r.emoji)}
						className={cn(
							"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-all",
							r.hasReacted
								? "bg-primary/15 ring-1 ring-primary/40 text-foreground font-medium"
								: "bg-muted/60 dark:bg-white/5 text-foreground/80 hover:bg-muted dark:hover:bg-white/10",
						)}
						aria-label={`React with ${r.emoji} (${r.count})`}
					>
						<span>{r.emoji}</span>
						<span className="text-xs tabular-nums">{r.count}</span>
					</button>
				))}

				{/* Inactive emojis as small ghost buttons */}
				{inactiveReactions.map((r) => (
					<button
						key={r.emoji}
						type="button"
						onClick={() => handleReaction(r.emoji)}
						className="inline-flex items-center justify-center rounded-full w-7 h-7 text-sm bg-muted/40 dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
						aria-label={`React with ${r.emoji}`}
					>
						{r.emoji}
					</button>
				))}

				{/* Comment toggle */}
				<button
					type="button"
					onClick={() => setShowComments((v) => !v)}
					className={cn(
						"ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors",
						showComments
							? "bg-muted text-foreground"
							: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
					)}
					aria-label="Toggle comments"
				>
					<MessageCircle size={13} />
					<span>
						{totalComments > 0
							? `${totalComments} comment${totalComments !== 1 ? "s" : ""}`
							: "Comment"}
					</span>
					{totalComments > 0 &&
						(showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
				</button>
			</div>

			{/* Comment thread */}
			{showComments && (
				<CommentThread
					cardId={cardId}
					comments={comments}
					currentUserId={currentUserId}
					isAdmin={isAdmin}
					onCommentsChange={handleCommentsChange}
				/>
			)}
		</div>
	);
}
