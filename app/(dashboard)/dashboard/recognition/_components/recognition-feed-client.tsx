"use client";

import { RecognitionFeed } from "./recognition-feed";

interface RecognitionFeedClientProps {
	filter: "received" | "sent";
	currentUserId: string;
	emptyTitle: string;
	emptyDescription: string;
	onShare: (cardId: string) => void;
}

export function RecognitionFeedClient({
	filter,
	currentUserId,
	emptyTitle,
	emptyDescription,
	onShare,
}: RecognitionFeedClientProps) {
	return (
		<RecognitionFeed
			cardMaxWidth="max-w-3xl"
			filter={filter}
			showTitle={false}
			showActions
			currentUserId={currentUserId}
			emptyTitle={emptyTitle}
			emptyDescription={emptyDescription}
			onShare={onShare}
		/>
	);
}
