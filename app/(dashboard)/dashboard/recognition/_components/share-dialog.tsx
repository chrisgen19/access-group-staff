"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";

interface ShareDialogProps {
	open: boolean;
	cardId: string | null;
	onClose: () => void;
	redirectOnClose?: boolean;
}

export function ShareDialog({ open, cardId, onClose, redirectOnClose = true }: ShareDialogProps) {
	const router = useRouter();
	const [copied, setCopied] = useState(false);
	const [shareUrl, setShareUrl] = useState("");

	useEffect(() => {
		if (cardId) {
			setShareUrl(`${window.location.origin}/recognition/${cardId}`);
		}
	}, [cardId]);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			toast.success("Link copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	}

	function handleDone() {
		onClose();
		if (redirectOnClose) {
			router.push("/dashboard/recognition");
		}
	}

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDone()}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
						<Share2 size={28} className="text-primary" />
					</div>
					<DialogTitle className="text-center">
						Recognition Card Sent!
					</DialogTitle>
					<DialogDescription className="text-center">
						Share this card with your team on Slack, Teams, email, or
						any messaging platform.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-2 mt-2">
					<input
						type="text"
						readOnly
						value={shareUrl}
						className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground truncate"
					/>
					<button
						type="button"
						onClick={handleCopy}
						className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						{copied ? (
							<Check size={18} />
						) : (
							<Copy size={18} />
						)}
					</button>
				</div>

				<DialogFooter className="mt-4">
					<button
						type="button"
						onClick={handleDone}
						className="w-full inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
					>
						Done
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
