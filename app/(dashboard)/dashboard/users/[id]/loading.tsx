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
			className="max-w-7xl mx-auto space-y-8 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading user details"
		>
			{/* Header row */}
			<div className="flex items-center gap-4">
				<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
				<div className="flex-1 min-w-0 space-y-2">
					<SkeletonLine className="h-10 w-64" />
					<SkeletonLine className="h-4 w-48" />
				</div>
				<SkeletonLine className="h-10 w-32 rounded-full shrink-0" />
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
					<div className="grid grid-cols-7 gap-2">
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
