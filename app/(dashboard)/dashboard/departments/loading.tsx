import {
	SkeletonLine,
	SkeletonPageHeader,
	SkeletonCard,
} from "@/components/shared/skeleton-primitives";

export default function DepartmentsLoading() {
	return (
		<div
			className="max-w-7xl mx-auto mt-2 space-y-8 animate-pulse"
			aria-busy="true"
			aria-label="Loading departments"
		>
			<SkeletonPageHeader action />

			<SkeletonCard className="overflow-hidden">
				{/* Table header */}
				<div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border-b">
					<SkeletonLine className="h-4 w-40 flex-1" />
					<SkeletonLine className="h-4 w-20" />
					<SkeletonLine className="h-4 w-20" />
					<SkeletonLine className="h-4 w-20" />
				</div>

				{/* Table rows */}
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={`row-${i}`}
						className="flex items-center gap-4 px-6 py-4 border-b last:border-0 border-gray-200/60 dark:border-white/10"
					>
						<SkeletonLine className="h-4 w-40 flex-1" />
						<SkeletonLine className="h-4 w-20" />
						<SkeletonLine className="h-6 w-12 rounded-full" />
						<div className="flex gap-2">
							<SkeletonLine className="h-8 w-8 rounded-lg" />
							<SkeletonLine className="h-8 w-8 rounded-lg" />
						</div>
					</div>
				))}
			</SkeletonCard>
		</div>
	);
}
