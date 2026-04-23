import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function SuperAdminLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading super admin settings"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-28" />
					<SkeletonLine className="h-10 w-44" />
					<SkeletonLine className="h-5 w-80" />
				</div>
			</div>

			{/* OAuth settings panel */}
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-7 w-56" />
					<SkeletonLine className="h-4 w-80" />
				</div>
				<div className="px-8 py-6 space-y-4">
					{["google", "microsoft"].map((key) => (
						<div
							key={key}
							className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-4"
						>
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-3 min-w-0">
									<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
									<div className="space-y-2 min-w-0">
										<SkeletonLine className="h-4 w-32" />
										<SkeletonLine className="h-3 w-56" />
									</div>
								</div>
								<SkeletonLine className="h-6 w-11 rounded-full shrink-0" />
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<SkeletonLine className="h-4 w-24" />
									<SkeletonLine className="h-10 w-full rounded-md" />
								</div>
								<div className="space-y-2">
									<SkeletonLine className="h-4 w-28" />
									<SkeletonLine className="h-10 w-full rounded-md" />
								</div>
							</div>
						</div>
					))}
				</div>
			</SkeletonCard>

			{/* Activity log retention panel */}
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-7 w-60" />
					<SkeletonLine className="h-4 w-96" />
				</div>
				<div className="px-8 py-6">
					<div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/10 p-5 gap-4">
						<div className="space-y-2 min-w-0 flex-1">
							<SkeletonLine className="h-4 w-40" />
							<SkeletonLine className="h-3 w-72" />
						</div>
						<SkeletonLine className="h-9 w-24 rounded-md shrink-0" />
					</div>
				</div>
			</SkeletonCard>
		</div>
	);
}
