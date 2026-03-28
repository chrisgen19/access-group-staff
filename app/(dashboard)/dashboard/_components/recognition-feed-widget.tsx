"use client";

import { RecognitionFeed } from "../recognition/_components/recognition-feed";

export function RecognitionFeedWidget() {
	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
			<div className="px-6 pt-6 pb-2">
				<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
					Public Recognition Feed
				</h3>
			</div>
			<div className="px-6 pb-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
				<RecognitionFeed filter="all" showTitle={false} />
			</div>
		</div>
	);
}
