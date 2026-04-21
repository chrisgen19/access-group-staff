import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

function OptionButtonSkeleton() {
	return (
		<div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-200 dark:border-white/10 p-3">
			<SkeletonLine className="h-10 w-full rounded-xl" />
			<SkeletonLine className="h-3 w-14" />
		</div>
	);
}

export default function PreferencesLoading() {
	return (
		<div className="animate-pulse" role="status" aria-busy="true" aria-label="Loading preferences">
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2">
					<SkeletonLine className="h-7 w-40" />
				</div>

				<div className="px-8 py-6 space-y-8">
					{/* Background Color */}
					<div className="space-y-4">
						<div className="space-y-2">
							<SkeletonLine className="h-4 w-40" />
							<SkeletonLine className="h-3 w-72" />
						</div>
						<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
							{["b0", "b1", "b2", "b3", "b4", "b5"].map((key) => (
								<OptionButtonSkeleton key={key} />
							))}
						</div>
					</div>

					{/* Card View */}
					<div className="space-y-4">
						<div className="space-y-2">
							<SkeletonLine className="h-4 w-24" />
							<SkeletonLine className="h-3 w-64" />
						</div>
						<div className="grid grid-cols-2 gap-3 max-w-xs">
							{["v0", "v1"].map((key) => (
								<div
									key={key}
									className="flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-200 dark:border-white/10 p-4"
								>
									<SkeletonLine className="h-10 w-10 rounded-xl" />
									<SkeletonLine className="h-3 w-14" />
								</div>
							))}
						</div>
					</div>

					{/* Card Size */}
					<div className="space-y-4">
						<div className="space-y-2">
							<SkeletonLine className="h-4 w-24" />
							<SkeletonLine className="h-3 w-64" />
						</div>
						<div className="grid grid-cols-3 gap-3 max-w-sm">
							{["s0", "s1", "s2"].map((key) => (
								<div
									key={key}
									className="flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-200 dark:border-white/10 p-4"
								>
									<SkeletonLine className="h-10 w-10 rounded-xl" />
									<SkeletonLine className="h-3 w-14" />
								</div>
							))}
						</div>
					</div>
				</div>
			</SkeletonCard>
		</div>
	);
}
