import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function RecognitionAllLoading() {
	return (
		<div
			className="space-y-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading recognition cards"
		>
			{/* Filter bar */}
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card p-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
					<SkeletonLine className="h-9 w-full lg:w-64 rounded-full" />
					<div className="flex flex-wrap gap-1.5">
						{["v0", "v1", "v2", "v3", "v4"].map((key) => (
							<SkeletonLine key={key} className="h-7 w-20 rounded-full" />
						))}
					</div>
					<div className="flex items-center gap-2 lg:ml-auto">
						<SkeletonLine className="h-9 w-24 rounded-lg" />
						<SkeletonLine className="h-9 w-20 rounded-lg" />
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<SkeletonLine className="h-9 w-24 rounded-md" />
					</div>
				</div>
			</div>

			{/* Table */}
			<SkeletonCard className="overflow-hidden">
				<div className="h-10 bg-muted/30 border-b border-gray-200/60 dark:border-white/10" />
				{["r0", "r1", "r2", "r3", "r4"].map((key) => (
					<div
						key={key}
						className="flex items-center gap-4 px-4 py-3 border-b border-gray-200/60 dark:border-white/10 last:border-0"
					>
						<div className="flex items-center gap-2 w-40">
							<SkeletonLine className="h-8 w-8 rounded-full" />
							<div className="space-y-1 min-w-0">
								<SkeletonLine className="h-4 w-24" />
								<SkeletonLine className="h-3 w-16" />
							</div>
						</div>
						<div className="flex items-center gap-2 w-40">
							<SkeletonLine className="h-8 w-8 rounded-full" />
							<div className="space-y-1 min-w-0">
								<SkeletonLine className="h-4 w-24" />
								<SkeletonLine className="h-3 w-16" />
							</div>
						</div>
						<SkeletonLine className="h-4 w-48 flex-1" />
						<div className="flex gap-1 w-32">
							<SkeletonLine className="h-6 w-14 rounded-full" />
							<SkeletonLine className="h-6 w-16 rounded-full" />
						</div>
						<SkeletonLine className="h-4 w-20" />
						<div className="flex justify-end gap-1 w-32 ml-auto">
							<SkeletonLine className="h-8 w-8 rounded-full" />
							<SkeletonLine className="h-8 w-8 rounded-full" />
							<SkeletonLine className="h-8 w-8 rounded-full" />
						</div>
					</div>
				))}
			</SkeletonCard>
		</div>
	);
}
