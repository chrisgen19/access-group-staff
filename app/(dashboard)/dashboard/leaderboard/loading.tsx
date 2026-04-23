import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function LeaderboardLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading leaderboard"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-24" />
					<SkeletonLine className="h-10 w-60" />
					<SkeletonLine className="h-5 w-80" />
				</div>
			</div>

			{/* Month picker row */}
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
				<SkeletonLine className="h-3 w-16" />
				<SkeletonLine className="h-10 w-full rounded-full sm:w-44" />
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
