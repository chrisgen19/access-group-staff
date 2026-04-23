import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function SecurityLoading() {
	return (
		<div
			className="animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading security settings"
		>
			<SkeletonCard className="overflow-hidden">
				<div className="space-y-2 px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
					<SkeletonLine className="h-7 w-48" />
					<SkeletonLine className="h-4 w-72" />
				</div>

				<div className="space-y-5 px-5 py-6 sm:px-8">
					{["current", "new", "confirm"].map((key) => (
						<div key={key} className="space-y-2">
							<SkeletonLine className="h-4 w-40" />
							<SkeletonLine className="h-12 w-full rounded-xl" />
						</div>
					))}
				</div>

				<div className="flex justify-end border-t border-gray-200/60 bg-gray-50/50 px-5 py-6 dark:border-white/10 dark:bg-white/[0.02] sm:px-8">
					<SkeletonLine className="h-10 w-full rounded-full sm:w-40" />
				</div>
			</SkeletonCard>
		</div>
	);
}
