"use client";

import { useState, useRef } from "react";
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
	initialCommentCount?: number;
	initialReactions?: { emoji: string; count: number; hasReacted: boolean }[];
}

export function CardInteractionBar({
	cardId,
	currentUserId,
	isAdmin,
	initialCommentCount = 0,
	initialReactions,
}: CardInteractionBarProps) {
	const queryClient = useQueryClient();
	const [showComments, setShowComments] = useState(false);
	// Lazy: only fetch when user first hovers (desktop) or interacts (mobile)
	const [fetchEnabled, setFetchEnabled] = useState(false);
	// Track in-flight emoji toggles to prevent double-tap race
	const pendingToggles = useRef(new Set<string>());

	const { data } = useQuery<{ success: boolean; data: CardInteractions }>({
		queryKey: ["card-interactions", cardId, currentUserId],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/recognition/${cardId}/interactions`, { signal });
			if (!res.ok) throw new Error("Failed to fetch interactions");
			return res.json();
		},
		enabled: fetchEnabled,
		staleTime: 30_000,
	});

	const interactions = data?.data;

	function handleReaction(emoji: string) {
		// Prevent double-tap race: skip if a toggle for this emoji is already in flight
		if (pendingToggles.current.has(emoji)) return;
		pendingToggles.current.add(emoji);

		// Ensure the query is (or will be) active
		setFetchEnabled(true);

		if (!interactions) {
			// Data not loaded yet — action handles add/remove atomically on server;
			// invalidate after so the query picks up the new state
			toggleReactionAction(cardId, emoji).then((result) => {
				pendingToggles.current.delete(emoji);
				if (!result.success) {
					toast.error(result.error);
				}
				queryClient.invalidateQueries({ queryKey: ["card-interactions", cardId, currentUserId] });
			});
			return;
		}

		// Optimistic update when we already have the current state
		queryClient.setQueryData<{ success: boolean; data: CardInteractions }>(
			["card-interactions", cardId, currentUserId],
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
			pendingToggles.current.delete(emoji);
			if (!result.success) {
				toast.error(result.error);
			}
			// Always invalidate to pick up concurrent reactions from other users
			queryClient.invalidateQueries({ queryKey: ["card-interactions", cardId, currentUserId] });
		});
	}

	function handleCommentToggle() {
		setFetchEnabled(true);
		setShowComments((v) => !v);
	}

	async function handleCommentsChange(comments: CardComment[]) {
		await queryClient.cancelQueries({ queryKey: ["card-interactions", cardId, currentUserId] });
		let seededFromScratch = false;
		queryClient.setQueryData<{ success: boolean; data: CardInteractions }>(
			["card-interactions", cardId, currentUserId],
			(old) => {
				// Seed cache from scratch if the lazy query hasn't fired yet
				if (!old?.data) {
					seededFromScratch = true;
					return {
						success: true,
						data: {
							reactions: REACTION_EMOJIS.map((emoji) => ({
								emoji,
								count: 0,
								hasReacted: false,
							})),
							comments,
							totalComments: comments.length,
						},
					};
				}
				return {
					...old,
					data: { ...old.data, comments, totalComments: comments.length },
				};
			},
		);
		// Refetch to reconcile pre-existing reactions/comments the seed doesn't know about
		if (seededFromScratch) {
			queryClient.invalidateQueries({ queryKey: ["card-interactions", cardId, currentUserId] });
		}
	}

	const reactions = interactions?.reactions ?? [];
	const comments = interactions?.comments ?? [];
	const totalComments = interactions?.totalComments ?? initialCommentCount;

	// Use initialReactions from the feed before the lazy fetch fires
	const displayReactions = interactions
		? reactions
		: initialReactions ?? [];

	const activeReactions = displayReactions.filter((r) => r.count > 0);
	// Build ghost buttons for emojis not already shown as active
	const activeEmojis = new Set(activeReactions.map((r) => r.emoji));
	const ghostReactions = REACTION_EMOJIS.filter((e) => !activeEmojis.has(e)).map(
		(emoji) => ({ emoji, count: 0, hasReacted: false }),
	);

	return (
		<div
			className="pt-3 mt-3 border-t border-border/50"
			onMouseEnter={() => setFetchEnabled(true)}
		>
			{/* Reaction row */}
			<div className="flex flex-wrap items-center gap-1.5">
				{/* Active reactions with counts */}
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

				{/* Ghost buttons for zero-count emojis */}
				{ghostReactions.map((r) => (
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
					onClick={handleCommentToggle}
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
