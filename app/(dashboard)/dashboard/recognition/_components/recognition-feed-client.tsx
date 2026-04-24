"use client";

import { useState } from "react";
import { RecognitionFeed } from "./recognition-feed";
import { ShareDialog } from "./share-dialog";

interface RecognitionFeedClientProps {
	filter: "received" | "sent";
	currentUserId: string;
	isAdmin: boolean;
	emptyTitle: string;
	emptyDescription: string;
}

export function RecognitionFeedClient({
	filter,
	currentUserId,
	isAdmin,
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
				isAdmin={isAdmin}
				emptyTitle={emptyTitle}
				emptyDescription={emptyDescription}
				onShare={setShareCardId}
				limit={10}
				infinite
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
