import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function RecognitionReceivedLoading() {
	return (
		<div
			className="space-y-4 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading received recognition cards"
		>
			{["c0", "c1", "c2"].map((key) => (
				<SkeletonCard key={key} className="p-6 max-w-3xl">
					<div className="flex items-center gap-3 mb-4">
						<SkeletonLine className="h-10 w-10 rounded-full" />
						<div className="space-y-1">
							<SkeletonLine className="h-4 w-32" />
							<SkeletonLine className="h-3 w-24" />
						</div>
						<SkeletonLine className="h-4 w-4 ml-1" />
						<SkeletonLine className="h-10 w-10 rounded-full" />
						<div className="space-y-1">
							<SkeletonLine className="h-4 w-32" />
							<SkeletonLine className="h-3 w-24" />
						</div>
						<div className="ml-auto flex gap-1">
							<SkeletonLine className="h-8 w-8 rounded-full" />
							<SkeletonLine className="h-8 w-8 rounded-full" />
						</div>
					</div>
					<div className="space-y-2 mb-3">
						<SkeletonLine className="h-4 w-full" />
						<SkeletonLine className="h-4 w-2/3" />
					</div>
					<div className="flex flex-wrap items-center gap-2 mb-4">
						<SkeletonLine className="h-6 w-16 rounded-full" />
						<SkeletonLine className="h-6 w-20 rounded-full" />
						<SkeletonLine className="h-3 w-20 ml-auto" />
					</div>
					<div className="flex items-center gap-4 pt-3 border-t border-gray-200/60 dark:border-white/10">
						<SkeletonLine className="h-6 w-14 rounded-full" />
						<SkeletonLine className="h-6 w-14 rounded-full" />
						<SkeletonLine className="h-6 w-20 rounded-full ml-auto" />
					</div>
				</SkeletonCard>
			))}
		</div>
	);
}
