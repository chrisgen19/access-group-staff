"use client";

import { useState } from "react";
import { RecognitionFeed } from "./recognition-feed";
import { ShareDialog } from "./share-dialog";

interface RecognitionFeedClientProps {
	filter: "received" | "sent";
	currentUserId: string;
	emptyTitle: string;
	emptyDescription: string;
}

export function RecognitionFeedClient({
	filter,
	currentUserId,
	emptyTitle,
	emptyDescription,
}: RecognitionFeedClientProps) {
	const [shareCardId, setShareCardId] = useState<string | null>(null);

	return (
		<>
			<RecognitionFeed
				cardMaxWidth="max-w-3xl"
				filter={filter}
				showTitle={false}
				showActions
				currentUserId={currentUserId}
				emptyTitle={emptyTitle}
				emptyDescription={emptyDescription}
				onShare={setShareCardId}
			/>
			<ShareDialog
				open={!!shareCardId}
				cardId={shareCardId}
				onClose={() => setShareCardId(null)}
				redirectOnClose={false}
			/>
		</>
	);
}
