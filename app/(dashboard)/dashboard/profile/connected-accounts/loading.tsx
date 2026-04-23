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
				<div className="space-y-2 px-5 pt-6 pb-2 sm:px-8 sm:pt-8">
					<SkeletonLine className="h-7 w-48" />
					<SkeletonLine className="h-4 w-64" />
				</div>
				<div className="space-y-3 px-5 py-6 sm:px-8">
					{[1, 2, 3].map((i) => (
						<div
							key={`provider-${i}`}
							className="flex flex-col gap-4 rounded-2xl border border-gray-200/60 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5"
						>
							<div className="flex items-center gap-3">
								<SkeletonLine className="h-10 w-10 rounded-full" />
								<div className="space-y-1">
									<SkeletonLine className="h-4 w-24" />
									<SkeletonLine className="h-3 w-48" />
								</div>
							</div>
							<SkeletonLine className="h-8 w-20 self-start rounded-full sm:self-auto" />
						</div>
					))}
				</div>
			</SkeletonCard>
		</div>
	);
}
