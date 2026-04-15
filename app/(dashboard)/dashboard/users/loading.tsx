import {
	SkeletonLine,
	SkeletonPageHeader,
	SkeletonCard,
} from "@/components/shared/skeleton-primitives";

export default function UsersLoading() {
	return (
		<div
			className="max-w-7xl mx-auto mt-2 space-y-8 animate-pulse"
			aria-busy="true"
			aria-label="Loading staff directory"
		>
			<SkeletonPageHeader action />

			<SkeletonCard className="overflow-hidden">
				{/* Search bar */}
				<div className="p-4 border-b border-gray-200/60 dark:border-white/10">
					<SkeletonLine className="h-12 w-full max-w-sm rounded-xl" />
				</div>

				{/* Table header */}
				<div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border-b">
					<SkeletonLine className="h-4 w-32" />
					<SkeletonLine className="h-4 w-28" />
					<SkeletonLine className="h-4 w-16" />
					<SkeletonLine className="h-4 w-16" />
					<SkeletonLine className="h-4 w-16" />
				</div>

				{/* Table rows */}
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={`row-${i}`}
						className="flex items-center gap-4 px-6 py-4 border-b last:border-0 border-gray-200/60 dark:border-white/10"
					>
						<div className="flex items-center gap-3 w-32">
							<SkeletonLine className="h-10 w-10 rounded-full" />
							<div className="space-y-1">
								<SkeletonLine className="h-4 w-24" />
								<SkeletonLine className="h-3 w-32" />
							</div>
						</div>
						<div className="space-y-1 w-28">
							<SkeletonLine className="h-4 w-20" />
							<SkeletonLine className="h-3 w-24" />
						</div>
						<SkeletonLine className="h-4 w-16" />
						<SkeletonLine className="h-6 w-16 rounded-full" />
						<SkeletonLine className="h-8 w-8 rounded-lg" />
					</div>
				))}

				{/* Footer */}
				<div className="px-6 py-3 border-t border-gray-200/60 dark:border-white/10">
					<SkeletonLine className="h-4 w-40" />
				</div>
			</SkeletonCard>
		</div>
	);
}
