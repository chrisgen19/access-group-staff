import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function RecognitionDetailLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-6 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading recognition card"
		>
			{/* Header row */}
			<div className="flex items-center gap-4">
				<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
				<div className="flex-1 min-w-0 space-y-2">
					<SkeletonLine className="h-10 w-64" />
					<SkeletonLine className="h-4 w-56" />
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<SkeletonLine className="h-10 w-10 rounded-full" />
					<SkeletonLine className="h-10 w-10 rounded-full" />
					<SkeletonLine className="h-10 w-10 rounded-full" />
				</div>
			</div>

			{/* Card placeholder */}
			<div className="flex justify-center">
				<div className="w-full max-w-4xl bg-[#e6e7e8] dark:bg-gray-800 shadow-2xl flex flex-col md:flex-row p-6 md:p-8 gap-6 min-h-[520px]">
					<div className="flex-1 flex flex-col gap-3">
						<div className="bg-white dark:bg-white/10 p-3 rounded-sm h-16 space-y-2">
							<SkeletonLine className="h-3 w-32" />
							<SkeletonLine className="h-5 w-40" />
						</div>
						<div className="bg-white dark:bg-white/10 p-3 rounded-sm flex-grow min-h-[160px] space-y-2">
							<SkeletonLine className="h-3 w-40" />
							<SkeletonLine className="h-4 w-full" />
							<SkeletonLine className="h-4 w-5/6" />
							<SkeletonLine className="h-4 w-2/3" />
						</div>
						<div className="bg-white dark:bg-white/10 p-3 rounded-sm h-16 space-y-2">
							<SkeletonLine className="h-3 w-32" />
							<SkeletonLine className="h-5 w-32" />
						</div>
						<div className="bg-white dark:bg-white/10 p-3 rounded-sm h-16 space-y-2">
							<SkeletonLine className="h-3 w-20" />
							<SkeletonLine className="h-5 w-36" />
						</div>
						<div className="bg-white dark:bg-white/10 p-3 rounded-sm h-16 space-y-2">
							<SkeletonLine className="h-3 w-12" />
							<SkeletonLine className="h-5 w-28" />
						</div>
					</div>
					<div className="flex-1 flex flex-col justify-center gap-4">
						<SkeletonLine className="h-8 w-3/4" />
						<SkeletonLine className="h-10 w-full" />
						<SkeletonLine className="h-10 w-5/6" />
					</div>
				</div>
			</div>

			{/* Interaction bar */}
			<div className="relative z-10 max-w-4xl mx-auto rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card px-6 py-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="flex items-center gap-4">
					<SkeletonLine className="h-8 w-20 rounded-full" />
					<SkeletonLine className="h-8 w-20 rounded-full" />
					<SkeletonLine className="h-8 w-20 rounded-full" />
					<div className="ml-auto flex items-center gap-2">
						<SkeletonLine className="h-8 w-8 rounded-full" />
						<SkeletonLine className="h-8 w-8 rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
