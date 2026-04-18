import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function ConnectedAccountsLoading() {
	return (
		<div
			className="animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading connected accounts"
		>
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-7 w-48" />
					<SkeletonLine className="h-4 w-64" />
				</div>
				<div className="px-8 py-6 space-y-3">
					{[1, 2, 3].map((i) => (
						<div
							key={`provider-${i}`}
							className="flex items-center justify-between rounded-2xl border border-gray-200/60 dark:border-white/10 px-5 py-4"
						>
							<div className="flex items-center gap-3">
								<SkeletonLine className="h-10 w-10 rounded-full" />
								<div className="space-y-1">
									<SkeletonLine className="h-4 w-24" />
									<SkeletonLine className="h-3 w-48" />
								</div>
							</div>
							<SkeletonLine className="h-8 w-20 rounded-full" />
						</div>
					))}
				</div>
			</SkeletonCard>
		</div>
	);
}
