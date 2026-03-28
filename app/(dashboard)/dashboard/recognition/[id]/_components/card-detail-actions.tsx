"use client";

import { useState } from "react";
import { Share2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { ShareDialog } from "../../_components/share-dialog";

export function CardDetailActions({
	cardId,
	isSender,
}: {
	cardId: string;
	isSender: boolean;
}) {
	const router = useRouter();
	const [showShare, setShowShare] = useState(false);

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={() => setShowShare(true)}
				className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
			>
				<Share2 size={16} />
				Share
			</button>
			{isSender && (
				<button
					type="button"
					onClick={() => router.push(`/dashboard/recognition/${cardId}/edit`)}
					className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all duration-200"
				>
					<Pencil size={16} />
					Edit
				</button>
			)}

			<ShareDialog
				open={showShare}
				cardId={cardId}
				onClose={() => setShowShare(false)}
				redirectOnClose={false}
			/>
		</div>
	);
}
