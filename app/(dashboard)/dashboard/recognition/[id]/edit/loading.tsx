import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function RecognitionEditLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading recognition editor"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-24" />
					<SkeletonLine className="h-10 w-72" />
					<SkeletonLine className="h-4 w-80" />
				</div>
			</div>
			<div className="mx-auto max-w-5xl py-2">
				{/* Progress bar skeleton */}
				<div className="mb-8 flex items-center justify-center gap-3">
					<SkeletonLine className="h-8 w-8 rounded-full" />
					<SkeletonLine className="h-1 w-16" />
					<SkeletonLine className="h-8 w-8 rounded-full" />
				</div>

				{/* Recognition card back skeleton */}
				<div className="flex flex-col gap-4 bg-[#e6e7e8] p-4 shadow-2xl dark:bg-gray-800 md:flex-row md:gap-6 md:p-8">
					{/* Left column */}
					<div className="flex flex-1 flex-col gap-4">
						<div className="h-20 space-y-2 rounded-sm bg-white p-3 dark:bg-white/10 md:p-4">
							<SkeletonLine className="h-3 w-12" />
							<SkeletonLine className="h-5 w-40" />
						</div>
						<div className="min-h-[300px] space-y-2 rounded-sm bg-white p-3 dark:bg-white/10 md:p-4">
							<SkeletonLine className="h-3 w-28" />
							<SkeletonLine className="h-4 w-full" />
							<SkeletonLine className="h-4 w-3/4" />
							<SkeletonLine className="h-4 w-1/2" />
						</div>
						<div className="flex gap-4">
							<div className="h-20 flex-1 space-y-2 rounded-sm bg-white p-3 dark:bg-white/10 md:p-4">
								<SkeletonLine className="h-3 w-16" />
								<SkeletonLine className="h-5 w-32" />
							</div>
							<div className="h-20 flex-1 space-y-2 rounded-sm bg-white p-3 dark:bg-white/10 md:p-4">
								<SkeletonLine className="h-3 w-12" />
								<SkeletonLine className="h-5 w-28" />
							</div>
						</div>
					</div>

					{/* Right column */}
					<div className="flex flex-1 flex-col gap-4">
						<div className="flex h-24 items-center justify-between px-2">
							<SkeletonLine className="h-10 w-32" />
							<SkeletonLine className="h-10 w-32" />
						</div>
						<div className="flex-grow space-y-5 rounded-sm bg-white p-6 dark:bg-white/10 md:p-8">
							<SkeletonLine className="h-4 w-64" />
							{["v0", "v1", "v2", "v3", "v4"].map((key) => (
								<div key={key} className="flex items-center gap-3">
									<SkeletonLine className="h-6 w-6" />
									<SkeletonLine className="h-5 w-32" />
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Action buttons */}
				<div className="mt-6 flex justify-end gap-3">
					<SkeletonLine className="h-12 w-28 rounded-full" />
					<SkeletonLine className="h-12 w-32 rounded-full" />
				</div>
			</div>
		</div>
	);
}
