import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

function InfoRowSkeleton() {
	return (
		<div className="flex justify-between items-center py-1 gap-4">
			<SkeletonLine className="h-4 w-24" />
			<SkeletonLine className="h-4 w-40" />
		</div>
	);
}

export default function UserDetailLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading user details"
		>
			<SkeletonLine className="h-10 w-40 rounded-full" />
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="min-w-0 space-y-3">
						<SkeletonLine className="h-3 w-20" />
						<SkeletonLine className="h-10 w-64" />
						<SkeletonLine className="h-4 w-48" />
					</div>
					<SkeletonLine className="h-10 w-32 rounded-full shrink-0" />
				</div>
			</div>

			{/* Info cards */}
			<div className="grid gap-6 md:grid-cols-2">
				{["personal", "work"].map((key) => (
					<SkeletonCard key={key} className="overflow-hidden">
						<div className="px-8 pt-8 pb-2">
							<SkeletonLine className="h-6 w-36" />
						</div>
						<div className="px-8 py-6 space-y-4">
							{["r0", "r1", "r2", "r3", "r4", "r5"].map((rowKey) => (
								<InfoRowSkeleton key={rowKey} />
							))}
						</div>
					</SkeletonCard>
				))}
			</div>

			{/* Shift schedule card */}
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-4 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
						<div className="space-y-2">
							<SkeletonLine className="h-6 w-40" />
							<SkeletonLine className="h-3 w-24" />
						</div>
					</div>
					<div className="space-y-2 text-right">
						<SkeletonLine className="h-6 w-20 ml-auto" />
						<SkeletonLine className="h-3 w-24 ml-auto" />
					</div>
				</div>
				<div className="px-8 pb-8">
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
						{["d0", "d1", "d2", "d3", "d4", "d5", "d6"].map((dayKey) => (
							<div
								key={dayKey}
								className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02] px-3 py-3 space-y-2"
							>
								<SkeletonLine className="h-3 w-10 mx-auto" />
								<SkeletonLine className="h-4 w-12 mx-auto" />
								<SkeletonLine className="h-4 w-12 mx-auto" />
							</div>
						))}
					</div>
				</div>
			</SkeletonCard>
		</div>
	);
}
