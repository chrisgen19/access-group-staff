import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function DashboardLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading dashboard"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-3">
						<SkeletonLine className="h-3 w-20" />
						<SkeletonLine className="h-10 w-80" />
						<SkeletonLine className="h-5 w-72" />
					</div>
					<SkeletonLine className="h-12 w-56 rounded-full" />
				</div>
			</div>

			{/* Feed (left on lg) + Stats (right on lg). On mobile, stats comes first. */}
			<div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
				{/* Feed widget skeleton */}
				<SkeletonCard className="overflow-hidden flex flex-col order-2 lg:order-1">
					<div className="px-6 pt-6 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<SkeletonLine className="h-6 w-44" />
						<SkeletonLine className="h-8 w-52 rounded-full" />
					</div>
					<div className="px-6 pb-6 space-y-4">
						{["f0", "f1", "f2"].map((key) => (
							<SkeletonCard key={key} className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<SkeletonLine className="h-10 w-10 rounded-full" />
									<SkeletonLine className="h-4 w-6" />
									<SkeletonLine className="h-10 w-10 rounded-full" />
									<SkeletonLine className="h-4 w-24" />
								</div>
								<div className="space-y-2 mb-4">
									<SkeletonLine className="h-4 w-full" />
									<SkeletonLine className="h-4 w-2/3" />
								</div>
								<div className="flex gap-2">
									<SkeletonLine className="h-6 w-16 rounded-full" />
									<SkeletonLine className="h-6 w-20 rounded-full" />
								</div>
							</SkeletonCard>
						))}
					</div>
				</SkeletonCard>

				{/* Stats widget skeleton */}
				<div className="order-1 lg:order-2">
					<SkeletonCard className="space-y-6 p-6 lg:sticky lg:top-8">
						<SkeletonLine className="h-6 w-40" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{["s0", "s1", "s2"].map((key) => (
								<div key={key} className="flex items-center gap-3">
									<SkeletonLine className="h-10 w-10 rounded-full" />
									<div className="space-y-1">
										<SkeletonLine className="h-6 w-8" />
										<SkeletonLine className="h-3 w-16" />
									</div>
								</div>
							))}
						</div>
						<div className="space-y-3">
							<SkeletonLine className="h-4 w-36" />
							{["u0", "u1", "u2"].map((key) => (
								<div
									key={key}
									className="flex items-center gap-3 rounded-xl border border-gray-200/60 dark:border-white/10 px-3 py-2.5"
								>
									<SkeletonLine className="h-[18px] w-[18px] rounded-full" />
									<SkeletonLine className="h-8 w-8 rounded-full" />
									<SkeletonLine className="h-4 w-24 flex-1" />
									<SkeletonLine className="h-5 w-8 rounded-full" />
								</div>
							))}
						</div>
					</SkeletonCard>
				</div>
			</div>
		</div>
	);
}
