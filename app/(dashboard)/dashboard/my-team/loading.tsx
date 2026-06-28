import {
	SkeletonCard,
	SkeletonLine,
	SkeletonPageHeader,
} from "@/components/shared/skeleton-primitives";

export default function MyTeamLoading() {
	return (
		<div
			className="mx-auto max-w-5xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading team"
		>
			<SkeletonPageHeader />

			{["g0", "g1"].map((group) => (
				<SkeletonCard key={group} className="overflow-hidden">
					<div className="flex items-center justify-between px-6 pt-6 pb-3 sm:px-8">
						<SkeletonLine className="h-5 w-40" />
						<SkeletonLine className="h-4 w-20" />
					</div>
					<div className="grid grid-cols-1 gap-px bg-gray-200/60 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
						{["m0", "m1", "m2"].map((member) => (
							<div key={member} className="flex items-center gap-3 bg-card px-6 py-4 sm:px-8">
								<SkeletonLine className="h-10 w-10 shrink-0 rounded-full" />
								<div className="min-w-0 space-y-1.5">
									<SkeletonLine className="h-4 w-28" />
									<SkeletonLine className="h-3 w-20" />
								</div>
							</div>
						))}
					</div>
				</SkeletonCard>
			))}
		</div>
	);
}
