import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function EditUserLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-8 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading user editor"
		>
			{/* Header row */}
			<div className="flex items-center gap-4">
				<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
				<div className="flex-1 min-w-0 space-y-2">
					<SkeletonLine className="h-10 w-72" />
					<SkeletonLine className="h-4 w-48" />
				</div>
			</div>

			{/* Main form card */}
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-8 w-40" />
				</div>
				<div className="px-8 py-6 space-y-5">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{["f0", "f1", "f2", "f3", "f4", "f5"].map((key) => (
							<div key={key} className="space-y-2">
								<SkeletonLine className="h-4 w-24" />
								<SkeletonLine className="h-12 w-full rounded-xl" />
							</div>
						))}
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-40" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
				</div>
				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end gap-3">
					<SkeletonLine className="h-10 w-24 rounded-full" />
					<SkeletonLine className="h-10 w-32 rounded-full" />
				</div>
			</SkeletonCard>

			{/* Reset password card */}
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-7 w-48" />
					<SkeletonLine className="h-4 w-80" />
				</div>
				<div className="px-8 py-6 space-y-5">
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-32" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
				</div>
				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end">
					<SkeletonLine className="h-10 w-40 rounded-full" />
				</div>
			</SkeletonCard>
		</div>
	);
}
