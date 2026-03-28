"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowRight } from "lucide-react";

interface RecognitionUser {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	position: string | null;
}

interface RecognitionCard {
	id: string;
	message: string;
	date: string;
	createdAt: string;
	sender: RecognitionUser;
	recipient: RecognitionUser;
	valuesPeople: boolean;
	valuesSafety: boolean;
	valuesRespect: boolean;
	valuesCommunication: boolean;
	valuesContinuousImprovement: boolean;
}

const VALUE_LABELS: Record<string, string> = {
	valuesPeople: "People",
	valuesSafety: "Safety",
	valuesRespect: "Respect",
	valuesCommunication: "Communication",
	valuesContinuousImprovement: "Continuous Improvement",
};

function getInitials(firstName: string, lastName: string) {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getSelectedValues(card: RecognitionCard): string[] {
	return Object.entries(VALUE_LABELS)
		.filter(([key]) => card[key as keyof RecognitionCard] === true)
		.map(([, label]) => label);
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function CardSkeleton() {
	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] animate-pulse">
			<div className="flex items-center gap-3 mb-4">
				<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
				<div className="h-4 w-6 bg-gray-200 dark:bg-white/10 rounded" />
				<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
				<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
			</div>
			<div className="space-y-2 mb-4">
				<div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
				<div className="h-4 w-2/3 bg-gray-200 dark:bg-white/10 rounded" />
			</div>
			<div className="flex gap-2">
				<div className="h-6 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
				<div className="h-6 w-20 bg-gray-200 dark:bg-white/10 rounded-full" />
			</div>
		</div>
	);
}

export function RecognitionFeed() {
	const { data, isPending } = useQuery<{
		success: boolean;
		data: RecognitionCard[];
	}>({
		queryKey: ["recognition-cards"],
		queryFn: async () => {
			const res = await fetch("/api/recognition");
			if (!res.ok) throw new Error("Failed to fetch recognition cards");
			return res.json();
		},
	});

	const cards = data?.data ?? [];

	if (isPending) {
		return (
			<div className="space-y-4">
				<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
					Recent Recognitions
				</h3>
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
					<Heart
						size={48}
						className="text-muted-foreground opacity-40"
					/>
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					No recognition cards yet
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					Be the first to recognize a colleague!
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
				Recent Recognitions
			</h3>
			{cards.map((card) => {
				const values = getSelectedValues(card);
				return (
					<div
						key={card.id}
						className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]"
					>
						{/* Header: Sender → Recipient */}
						<div className="flex items-center gap-3 mb-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
								{getInitials(
									card.sender.firstName,
									card.sender.lastName,
								)}
							</div>
							<div className="text-sm">
								<span className="font-medium text-foreground">
									{card.sender.firstName} {card.sender.lastName}
								</span>
								{card.sender.position && (
									<p className="text-muted-foreground text-xs">
										{card.sender.position}
									</p>
								)}
							</div>
							<ArrowRight
								size={16}
								className="text-muted-foreground mx-1"
							/>
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
								{getInitials(
									card.recipient.firstName,
									card.recipient.lastName,
								)}
							</div>
							<div className="text-sm">
								<span className="font-medium text-foreground">
									{card.recipient.firstName}{" "}
									{card.recipient.lastName}
								</span>
								{card.recipient.position && (
									<p className="text-muted-foreground text-xs">
										{card.recipient.position}
									</p>
								)}
							</div>
						</div>

						{/* Message */}
						<p className="text-sm text-foreground/80 mb-3 leading-relaxed">
							{card.message}
						</p>

						{/* Footer: Values + Date */}
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
								{formatDate(card.date)}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
