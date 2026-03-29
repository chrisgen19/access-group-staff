"use client";

import { useState } from "react";
import { ShareDialog } from "./share-dialog";

interface RecognitionTabShellProps {
	children: (onShare: (cardId: string) => void) => React.ReactNode;
}

export function RecognitionTabShell({ children }: RecognitionTabShellProps) {
	const [shareCardId, setShareCardId] = useState<string | null>(null);

	return (
		<>
			{children(setShareCardId)}
			<ShareDialog
				open={!!shareCardId}
				cardId={shareCardId}
				onClose={() => setShareCardId(null)}
				redirectOnClose={false}
			/>
		</>
	);
}
