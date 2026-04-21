import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function LeaderboardLoading() {
	return (
		<div
			className="max-w-7xl mx-auto mt-2 space-y-8 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading leaderboard"
		>
			{/* Page header */}
			<div className="space-y-3">
				<SkeletonLine className="h-10 w-60" />
				<SkeletonLine className="h-5 w-80" />
			</div>

			{/* Month picker row */}
			<div className="flex flex-wrap items-center gap-3">
				<SkeletonLine className="h-4 w-16" />
				<SkeletonLine className="h-9 w-44 rounded-md" />
			</div>

			{/* Podium panel */}
			<SkeletonCard className="px-6 py-6 sm:px-8 sm:py-8">
				<div className="flex flex-wrap items-center gap-3 mb-6">
					<SkeletonLine className="h-5 w-5 rounded-full" />
					<SkeletonLine className="h-6 w-56" />
					<SkeletonLine className="h-5 w-14 rounded-full" />
				</div>

				<ol className="space-y-2">
					{["p0", "p1", "p2"].map((key) => (
						<li
							key={key}
							className="flex items-center gap-3 rounded-xl border border-gray-200/60 dark:border-white/10 bg-card px-3 py-2.5 shadow-sm"
						>
							<SkeletonLine className="h-[18px] w-[18px] rounded-full shrink-0" />
							<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
							<SkeletonLine className="h-4 flex-1 max-w-[14rem]" />
							<SkeletonLine className="h-6 w-10 rounded-full" />
						</li>
					))}
					{["r3", "r4", "r5", "r6", "r7"].map((key) => (
						<li key={key} className="flex items-center gap-3 rounded-xl px-3 py-2">
							<SkeletonLine className="h-3 w-3 shrink-0" />
							<SkeletonLine className="h-8 w-8 rounded-full shrink-0" />
							<SkeletonLine className="h-4 flex-1 max-w-[12rem]" />
							<SkeletonLine className="h-4 w-6" />
						</li>
					))}
				</ol>
			</SkeletonCard>
		</div>
	);
}
