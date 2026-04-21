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
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-7 w-48" />
					<SkeletonLine className="h-4 w-72" />
				</div>

				<div className="px-8 py-6 space-y-5">
					{["current", "new", "confirm"].map((key) => (
						<div key={key} className="space-y-2">
							<SkeletonLine className="h-4 w-40" />
							<SkeletonLine className="h-12 w-full rounded-xl" />
						</div>
					))}
				</div>

				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end">
					<SkeletonLine className="h-10 w-40 rounded-full" />
				</div>
			</SkeletonCard>
		</div>
	);
}
