"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, Heart, Pencil, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useUnreadCardIds } from "@/hooks/use-unread-card-ids";
import { formatRecognitionDate, getSelectedValues, type RecognitionCard } from "@/lib/recognition";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import { CardInteractionBar } from "./card-interaction-bar";
import { RecognitionCardMini } from "./recognition-card-mini";

type FeedFilter = "all" | "received" | "sent" | "department";

interface FeedPage {
	success: boolean;
	data: RecognitionCard[];
	nextCursor: string | null;
}

function buildFeedUrl(filter: FeedFilter, limit: number, cursor?: string | null) {
	const params = new URLSearchParams();
	if (filter !== "all") params.set("filter", filter);
	params.set("limit", String(limit));
	if (cursor) params.set("cursor", cursor);
	const query = params.toString();
	return `/api/recognition${query ? `?${query}` : ""}`;
}

function CardSkeleton() {
	return (
		<SkeletonCard
			className="p-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading recognition card"
		>
			<div className="flex items-center gap-3 mb-3">
				<SkeletonLine className="h-10 w-10 rounded-full" />
				<div className="space-y-1">
					<SkeletonLine className="h-4 w-32" />
					<SkeletonLine className="h-3 w-24" />
				</div>
				<SkeletonLine className="h-4 w-4 mx-1" />
				<SkeletonLine className="h-10 w-10 rounded-full" />
				<div className="space-y-1">
					<SkeletonLine className="h-4 w-32" />
					<SkeletonLine className="h-3 w-24" />
				</div>
				<div className="ml-auto flex gap-1">
					<SkeletonLine className="h-8 w-8 rounded-full" />
					<SkeletonLine className="h-8 w-8 rounded-full" />
					<SkeletonLine className="h-8 w-8 rounded-full" />
				</div>
			</div>
			<div className="space-y-2 mb-3">
				<SkeletonLine className="h-4 w-full" />
				<SkeletonLine className="h-4 w-2/3" />
			</div>
			<div className="flex flex-wrap items-center gap-2 mb-4">
				<SkeletonLine className="h-6 w-16 rounded-full" />
				<SkeletonLine className="h-6 w-20 rounded-full" />
				<SkeletonLine className="h-3 w-20 ml-auto" />
			</div>
			<div className="flex items-center gap-4 pt-3 border-t border-gray-200/60 dark:border-white/10">
				<SkeletonLine className="h-6 w-14 rounded-full" />
				<SkeletonLine className="h-6 w-14 rounded-full" />
				<SkeletonLine className="h-6 w-20 rounded-full ml-auto" />
			</div>
		</SkeletonCard>
	);
}

function CardActions({
	cardId,
	isSender,
	onShare,
}: {
	cardId: string;
	isSender: boolean;
	onShare: (cardId: string) => void;
}) {
	const router = useRouter();

	return (
		<div className="flex gap-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100">
			<button
				type="button"
				onClick={() => router.push(`/dashboard/recognition/${cardId}`)}
				className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
				aria-label="View card"
			>
				<Eye size={16} />
			</button>
			<button
				type="button"
				onClick={() => onShare(cardId)}
				className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
				aria-label="Share card"
			>
				<Share2 size={16} />
			</button>
			{isSender && (
				<button
					type="button"
					onClick={() => router.push(`/dashboard/recognition/${cardId}/edit`)}
					className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
					aria-label="Edit card"
				>
					<Pencil size={16} />
				</button>
			)}
		</div>
	);
}

interface RecognitionFeedProps {
	filter?: FeedFilter;
	showTitle?: boolean;
	showActions?: boolean;
	currentUserId?: string;
	isAdmin?: boolean;
	cardMaxWidth?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	onShare?: (cardId: string) => void;
	limit?: number;
	infinite?: boolean;
}

export function RecognitionFeed(props: RecognitionFeedProps) {
	if (props.infinite) return <RecognitionFeedInfinite {...props} />;
	return <RecognitionFeedStatic {...props} />;
}

function RecognitionFeedStatic({
	filter = "all",
	showTitle = true,
	showActions = false,
	currentUserId = "",
	isAdmin = false,
	cardMaxWidth,
	emptyTitle = "No recognition cards yet",
	emptyDescription = "Be the first to recognize a colleague!",
	onShare,
	limit = 50,
}: RecognitionFeedProps) {
	const { data, isPending } = useQuery<FeedPage>({
		queryKey: ["recognition-cards", filter, { limit, infinite: false }],
		queryFn: async () => {
			const res = await fetch(buildFeedUrl(filter, limit));
			if (!res.ok) throw new Error("Failed to fetch recognition cards");
			return res.json();
		},
		staleTime: 30_000,
	});

	const cards = data?.data ?? [];

	return (
		<FeedLayout
			filter={filter}
			showTitle={showTitle}
			showActions={showActions}
			currentUserId={currentUserId}
			isAdmin={isAdmin}
			cardMaxWidth={cardMaxWidth}
			emptyTitle={emptyTitle}
			emptyDescription={emptyDescription}
			onShare={onShare}
			cards={cards}
			isPending={isPending}
		/>
	);
}

function RecognitionFeedInfinite({
	filter = "all",
	showTitle = true,
	showActions = false,
	currentUserId = "",
	isAdmin = false,
	cardMaxWidth,
	emptyTitle = "No recognition cards yet",
	emptyDescription = "Be the first to recognize a colleague!",
	onShare,
	limit = 10,
}: RecognitionFeedProps) {
	const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery<
		FeedPage,
		Error,
		{ pages: FeedPage[] },
		readonly unknown[],
		string | null
	>({
		queryKey: ["recognition-cards", filter, { limit, infinite: true }],
		initialPageParam: null,
		queryFn: async ({ pageParam }) => {
			const res = await fetch(buildFeedUrl(filter, limit, pageParam));
			if (!res.ok) throw new Error("Failed to fetch recognition cards");
			return res.json();
		},
		getNextPageParam: (last) => last.nextCursor ?? undefined,
		staleTime: 30_000,
	});

	const cards = data?.pages.flatMap((p) => p.data) ?? [];

	const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
		enabled: !!hasNextPage && !isFetchingNextPage,
	});

	useEffect(() => {
		if (isIntersecting && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<FeedLayout
			filter={filter}
			showTitle={showTitle}
			showActions={showActions}
			currentUserId={currentUserId}
			isAdmin={isAdmin}
			cardMaxWidth={cardMaxWidth}
			emptyTitle={emptyTitle}
			emptyDescription={emptyDescription}
			onShare={onShare}
			cards={cards}
			isPending={isPending}
			footer={
				hasNextPage ? (
					<>
						<div ref={sentinelRef} aria-hidden className="h-px w-full" />
						{isFetchingNextPage ? (
							<CardSkeleton />
						) : (
							<div className="flex justify-center pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
								>
									Load more
								</Button>
							</div>
						)}
					</>
				) : null
			}
		/>
	);
}

interface FeedLayoutProps {
	filter: FeedFilter;
	showTitle: boolean;
	showActions: boolean;
	currentUserId: string;
	isAdmin: boolean;
	cardMaxWidth?: string;
	emptyTitle: string;
	emptyDescription: string;
	onShare?: (cardId: string) => void;
	cards: RecognitionCard[];
	isPending: boolean;
	footer?: React.ReactNode;
}

function FeedLayout({
	filter,
	showTitle,
	showActions,
	currentUserId,
	isAdmin,
	cardMaxWidth,
	emptyTitle,
	emptyDescription,
	onShare,
	cards,
	isPending,
	footer,
}: FeedLayoutProps) {
	const cardView = usePreferencesStore((s) => s.cardView);
	const cardSize = usePreferencesStore((s) => s.cardSize);
	const { unreadCardIds } = useUnreadCardIds(filter === "received");

	const handleShare = (cardId: string) => {
		onShare?.(cardId);
	};

	if (isPending) {
		return (
			<div className="space-y-4">
				{showTitle && (
					<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
						Recent Recognitions
					</h3>
				)}
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card p-16 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="mb-6 rounded-full bg-background p-6">
					<Heart size={48} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">{emptyTitle}</p>
				<p className="mt-2 text-base text-muted-foreground">{emptyDescription}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{showTitle && (
				<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
					Recent Recognitions
				</h3>
			)}
			{cards.map((card) => {
				const isSender = currentUserId === card.sender.id;
				const actions =
					showActions && onShare ? (
						<CardActions cardId={card.id} isSender={isSender} onShare={handleShare} />
					) : null;

				if (cardView === "physical") {
					const isNew = filter === "received" && unreadCardIds.has(card.id);
					return (
						<div
							key={card.id}
							className={cn(
								"group relative isolate rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]",
								cardMaxWidth,
							)}
						>
							<div className="relative overflow-hidden rounded-t-[2rem]">
								<RecognitionCardMini card={card} size={cardSize} isNew={isNew} />
								{actions && <div className="absolute top-3 right-3 z-10">{actions}</div>}
							</div>
							<div className="px-5 pb-4">
								<CardInteractionBar
									cardId={card.id}
									currentUserId={currentUserId}
									isAdmin={isAdmin}
									initialCommentCount={card.interactionCounts?.comments ?? 0}
									initialReactions={card.reactionSummary}
								/>
							</div>
						</div>
					);
				}

				const values = getSelectedValues(card);
				const isNewCard = filter === "received" && unreadCardIds.has(card.id);
				return (
					<div
						key={card.id}
						className={cn(
							"group rounded-[2rem] border bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]",
							isNewCard
								? "border-primary/40 ring-1 ring-primary/20"
								: "border-gray-200/60 dark:border-white/10",
							cardMaxWidth,
						)}
					>
						<div className="flex items-center gap-3 mb-3">
							<UserAvatar
								firstName={card.sender.firstName}
								lastName={card.sender.lastName}
								avatar={card.sender.avatar}
								size="lg"
								className="bg-primary/10 text-primary"
							/>
							<div className="text-sm">
								<span className="font-medium text-foreground">
									{card.sender.firstName} {card.sender.lastName}
								</span>
								{card.sender.position && (
									<p className="text-muted-foreground text-xs">{card.sender.position}</p>
								)}
							</div>
							<ArrowRight size={16} className="text-muted-foreground mx-1" />
							<UserAvatar
								firstName={card.recipient.firstName}
								lastName={card.recipient.lastName}
								avatar={card.recipient.avatar}
								size="lg"
								className="bg-primary/10 text-primary"
							/>
							<div className="text-sm">
								<span className="font-medium text-foreground">
									{card.recipient.firstName} {card.recipient.lastName}
								</span>
								{card.recipient.position && (
									<p className="text-muted-foreground text-xs">{card.recipient.position}</p>
								)}
							</div>
							<div className="ml-auto flex items-center gap-2">
								{isNewCard && (
									<span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase tracking-wide">
										New
									</span>
								)}
								{actions}
							</div>
						</div>

						<p className="text-sm text-foreground/80 mb-3 leading-relaxed">{card.message}</p>

						<div className="flex flex-wrap items-center gap-2">
							{values.map((value) => (
								<span
									key={value}
									className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/10"
								>
									{value}
								</span>
							))}
							<span className="ml-auto text-xs text-muted-foreground">
								{formatRecognitionDate(card.date)}
							</span>
						</div>

						<CardInteractionBar
							cardId={card.id}
							currentUserId={currentUserId}
							isAdmin={isAdmin}
							initialCommentCount={card.interactionCounts?.comments ?? 0}
							initialReactions={card.reactionSummary}
						/>
					</div>
				);
			})}
			{footer}
		</div>
	);
}
