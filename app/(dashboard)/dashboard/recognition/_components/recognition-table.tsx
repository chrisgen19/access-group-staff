"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Eye, Share2, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import {
	type RecognitionCard,
	getSelectedValues,
	formatRecognitionDate,
} from "@/lib/recognition";
import { deleteRecognitionCardAction } from "@/lib/actions/recognition-actions";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function TableSkeleton() {
	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden">
			<div className="animate-pulse">
				<div className="h-10 bg-muted/30 border-b" />
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={`skeleton-row-${i}`}
						className="flex items-center gap-4 px-4 py-3 border-b last:border-0"
					>
						<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded flex-1" />
						<div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

interface RecognitionTableProps {
	onShare: (cardId: string) => void;
}

export function RecognitionTable({ onShare }: RecognitionTableProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { data, isPending } = useQuery<{
		success: boolean;
		data: RecognitionCard[];
	}>({
		queryKey: ["recognition-cards", "all"],
		queryFn: async () => {
			const res = await fetch("/api/recognition");
			if (!res.ok) throw new Error("Failed to fetch recognition cards");
			return res.json();
		},
		staleTime: 30_000,
	});

	const cards = data?.data ?? [];

	async function handleDelete() {
		if (!deleteCardId) return;
		setIsDeleting(true);
		try {
			const result = await deleteRecognitionCardAction(deleteCardId);
			if (result.success) {
				toast.success("Recognition card deleted");
				queryClient.invalidateQueries({ queryKey: ["recognition-cards"] });
			} else {
				toast.error(result.error);
			}
		} catch {
			toast.error("Failed to delete recognition card");
		} finally {
			setIsDeleting(false);
			setDeleteCardId(null);
		}
	}

	if (isPending) {
		return <TableSkeleton />;
	}

	if (cards.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
				<div className="mb-6 rounded-full bg-background p-6">
					<Heart size={48} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					No recognition cards yet
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					No one has sent a recognition card yet.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30 hover:bg-muted/30">
							<TableHead>From</TableHead>
							<TableHead>To</TableHead>
							<TableHead>Message</TableHead>
							<TableHead>Values</TableHead>
							<TableHead>Date</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{cards.map((card) => {
							const values = getSelectedValues(card);
							return (
								<TableRow key={card.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
												{getInitials(card.sender.firstName, card.sender.lastName)}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium text-foreground truncate">
													{card.sender.firstName} {card.sender.lastName}
												</p>
												{card.sender.position && (
													<p className="text-xs text-muted-foreground truncate">
														{card.sender.position}
													</p>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
												{getInitials(card.recipient.firstName, card.recipient.lastName)}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium text-foreground truncate">
													{card.recipient.firstName} {card.recipient.lastName}
												</p>
												{card.recipient.position && (
													<p className="text-xs text-muted-foreground truncate">
														{card.recipient.position}
													</p>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="max-w-xs">
										<p className="text-sm text-foreground/80 truncate">
											{card.message}
										</p>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{values.map((value) => (
												<span
													key={value}
													className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/10"
												>
													{value}
												</span>
											))}
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm text-muted-foreground">
											{formatRecognitionDate(card.date)}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<button
												type="button"
												onClick={() => router.push(`/dashboard/recognition/${card.id}`)}
												className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
												aria-label="View card"
											>
												<Eye size={16} />
											</button>
											<button
												type="button"
												onClick={() => onShare(card.id)}
												className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
												aria-label="Share card"
											>
												<Share2 size={16} />
											</button>
											<button
												type="button"
												onClick={() => setDeleteCardId(card.id)}
												className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
												aria-label="Delete card"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			<AlertDialog open={!!deleteCardId} onOpenChange={(open) => !open && setDeleteCardId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete recognition card?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the recognition card.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
