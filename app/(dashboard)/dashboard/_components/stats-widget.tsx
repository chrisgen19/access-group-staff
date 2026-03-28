"use client";

import { useQuery } from "@tanstack/react-query";
import { Send, Inbox, Calendar, Trophy } from "lucide-react";

interface StatsData {
	sent: number;
	received: number;
	monthlyTotal: number;
	topRecipients: {
		firstName: string;
		lastName: string;
		avatar: string | null;
		count: number;
	}[];
}

function getInitials(firstName: string, lastName: string) {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatItem({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ size?: number; className?: string }>;
	label: string;
	value: number;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
				<Icon size={18} className="text-primary" />
			</div>
			<div>
				<p className="text-2xl font-semibold text-foreground">{value}</p>
				<p className="text-xs text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}

function StatsWidgetSkeleton() {
	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] animate-pulse space-y-6">
			<div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded" />
			<div className="grid grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
						<div className="space-y-1">
							<div className="h-6 w-8 bg-gray-200 dark:bg-white/10 rounded" />
							<div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded" />
						</div>
					</div>
				))}
			</div>
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10" />
						<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

export function StatsWidget() {
	const { data, isPending, isError } = useQuery<{
		success: boolean;
		data: StatsData;
	}>({
		queryKey: ["recognition-stats"],
		queryFn: async () => {
			const res = await fetch("/api/recognition/stats");
			if (!res.ok) throw new Error("Failed to fetch stats");
			return res.json();
		},
	});

	if (isPending) {
		return <StatsWidgetSkeleton />;
	}

	if (isError || !data?.data) {
		return (
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight mb-2">
					Recognition Stats
				</h3>
				<p className="text-sm text-muted-foreground">
					Unable to load stats. Please try again later.
				</p>
			</div>
		);
	}

	const stats = data.data;

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] space-y-6">
			<h3 className="text-[1.25rem] font-medium text-foreground tracking-tight">
				Recognition Stats
			</h3>

			<div className="grid grid-cols-3 gap-4">
				<StatItem
					icon={Send}
					label="Cards Sent"
					value={stats?.sent ?? 0}
				/>
				<StatItem
					icon={Inbox}
					label="Cards Received"
					value={stats?.received ?? 0}
				/>
				<StatItem
					icon={Calendar}
					label="This Month"
					value={stats?.monthlyTotal ?? 0}
				/>
			</div>

			{stats?.topRecipients && stats.topRecipients.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-3">
						<Trophy size={16} className="text-primary" />
						<h4 className="text-sm font-medium text-foreground/70">
							Most Recognized
						</h4>
					</div>
					<div className="space-y-3">
						{stats.topRecipients.map((person, i) => (
							<div
								key={`${person.firstName}-${person.lastName}`}
								className="flex items-center gap-3"
							>
								<span className="text-xs font-semibold text-muted-foreground w-4">
									{i + 1}.
								</span>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
									{getInitials(
										person.firstName,
										person.lastName,
									)}
								</div>
								<span className="text-sm font-medium text-foreground flex-1">
									{person.firstName} {person.lastName}
								</span>
								<span className="text-sm font-semibold text-primary">
									{person.count}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
