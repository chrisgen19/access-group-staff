import {
	SkeletonLine,
	SkeletonPageHeader,
	SkeletonCard,
} from "@/components/shared/skeleton-primitives";

export default function SuperAdminLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-8 mt-2 animate-pulse"
			aria-busy="true"
			aria-label="Loading super admin"
		>
			<SkeletonPageHeader />

			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-6 w-40" />
					<SkeletonLine className="h-4 w-72" />
				</div>
				<div className="px-8 py-6 space-y-4">
					{[1, 2].map((i) => (
						<div
							key={`toggle-${i}`}
							className="flex items-center justify-between rounded-2xl border border-gray-200/60 dark:border-white/10 px-5 py-4"
						>
							<div className="flex items-center gap-3">
								<SkeletonLine className="h-10 w-10 rounded-full" />
								<div className="space-y-1">
									<SkeletonLine className="h-4 w-28" />
									<SkeletonLine className="h-3 w-48" />
								</div>
							</div>
							<SkeletonLine className="h-6 w-12 rounded-full" />
						</div>
					))}
				</div>
			</SkeletonCard>
		</div>
	);
}
