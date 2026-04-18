import {
	SkeletonCard,
	SkeletonLine,
	SkeletonPageHeader,
} from "@/components/shared/skeleton-primitives";

export default function DashboardLoading() {
	return (
		<div
			className="max-w-7xl mx-auto mt-2 space-y-8 animate-pulse"
			aria-busy="true"
			aria-label="Loading dashboard"
		>
			<SkeletonPageHeader action />

			<div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
				{/* Stats widget skeleton */}
				<SkeletonCard className="p-6 space-y-6">
					<SkeletonLine className="h-5 w-32" />
					<div className="grid grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={`stat-${i}`} className="flex items-center gap-3">
								<SkeletonLine className="h-10 w-10 rounded-full" />
								<div className="space-y-1">
									<SkeletonLine className="h-6 w-8" />
									<SkeletonLine className="h-3 w-16" />
								</div>
							</div>
						))}
					</div>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={`user-${i}`} className="flex items-center gap-3">
								<SkeletonLine className="h-8 w-8 rounded-full" />
								<SkeletonLine className="h-4 w-24" />
							</div>
						))}
					</div>
				</SkeletonCard>

				{/* Feed widget skeleton */}
				<SkeletonCard className="p-6 space-y-4">
					<SkeletonLine className="h-5 w-40" />
					<div className="flex gap-2">
						<SkeletonLine className="h-8 w-20 rounded-full" />
						<SkeletonLine className="h-8 w-28 rounded-full" />
					</div>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div
								key={`card-${i}`}
								className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 p-6 space-y-3"
							>
								<div className="flex items-center gap-3">
									<SkeletonLine className="h-10 w-10 rounded-full" />
									<SkeletonLine className="h-4 w-6" />
									<SkeletonLine className="h-10 w-10 rounded-full" />
									<SkeletonLine className="h-4 w-24" />
								</div>
								<div className="space-y-2">
									<SkeletonLine className="h-4 w-full" />
									<SkeletonLine className="h-4 w-2/3" />
								</div>
								<div className="flex gap-2">
									<SkeletonLine className="h-6 w-16 rounded-full" />
									<SkeletonLine className="h-6 w-20 rounded-full" />
								</div>
							</div>
						))}
					</div>
				</SkeletonCard>
			</div>
		</div>
	);
}
