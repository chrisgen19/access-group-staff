import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function EditRecognitionLoading() {
	return (
		<div
			className="max-w-5xl mx-auto py-4 animate-pulse"
			aria-busy="true"
			aria-label="Loading recognition form"
		>
			{/* Progress bar skeleton */}
			<div className="flex items-center justify-center gap-3 mb-8">
				<SkeletonLine className="h-8 w-8 rounded-full" />
				<SkeletonLine className="h-1 w-16" />
				<SkeletonLine className="h-8 w-8 rounded-full" />
			</div>

			{/* Recognition card back skeleton */}
			<div className="bg-[#e6e7e8] dark:bg-gray-800 p-4 md:p-8 shadow-2xl flex flex-col md:flex-row gap-4 md:gap-6">
				{/* Left column */}
				<div className="flex-1 flex flex-col gap-4">
					<div className="bg-white dark:bg-white/10 p-3 md:p-4 rounded-sm h-20 space-y-2">
						<SkeletonLine className="h-3 w-12" />
						<SkeletonLine className="h-5 w-40" />
					</div>
					<div className="bg-white dark:bg-white/10 p-3 md:p-4 rounded-sm min-h-[300px] space-y-2">
						<SkeletonLine className="h-3 w-28" />
						<SkeletonLine className="h-4 w-full" />
						<SkeletonLine className="h-4 w-3/4" />
						<SkeletonLine className="h-4 w-1/2" />
					</div>
					<div className="flex gap-4">
						<div className="bg-white dark:bg-white/10 p-3 md:p-4 rounded-sm flex-1 h-20 space-y-2">
							<SkeletonLine className="h-3 w-16" />
							<SkeletonLine className="h-5 w-32" />
						</div>
						<div className="bg-white dark:bg-white/10 p-3 md:p-4 rounded-sm flex-1 h-20 space-y-2">
							<SkeletonLine className="h-3 w-12" />
							<SkeletonLine className="h-5 w-28" />
						</div>
					</div>
				</div>

				{/* Right column */}
				<div className="flex-1 flex flex-col gap-4">
					<div className="h-24 flex items-center justify-between px-2">
						<SkeletonLine className="h-10 w-32" />
						<SkeletonLine className="h-10 w-32" />
					</div>
					<div className="bg-white dark:bg-white/10 p-6 md:p-8 rounded-sm flex-grow space-y-5">
						<SkeletonLine className="h-4 w-64" />
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={`value-${i}`} className="flex items-center gap-3">
								<SkeletonLine className="h-6 w-6" />
								<SkeletonLine className="h-5 w-32" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex justify-end gap-3 mt-6">
				<SkeletonLine className="h-12 w-28 rounded-full" />
				<SkeletonLine className="h-12 w-32 rounded-full" />
			</div>
		</div>
	);
}
