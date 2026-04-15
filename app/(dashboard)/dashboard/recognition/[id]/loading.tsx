import {
	SkeletonLine,
	SkeletonCard,
} from "@/components/shared/skeleton-primitives";

export default function RecognitionDetailLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-6 mt-2 animate-pulse"
			aria-busy="true"
			aria-label="Loading recognition card"
		>
			{/* Header: back button + title + actions */}
			<div className="flex items-center gap-4">
				<SkeletonLine className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<SkeletonLine className="h-10 w-56" />
					<SkeletonLine className="h-5 w-48" />
				</div>
				<div className="flex gap-2">
					<SkeletonLine className="h-10 w-10 rounded-full" />
					<SkeletonLine className="h-10 w-10 rounded-full" />
				</div>
			</div>

			{/* FlipCard placeholder */}
			<div className="flex justify-center">
				<SkeletonCard className="w-full max-w-5xl">
					<div className="bg-gray-300/40 dark:bg-white/5 h-28" />
					<div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
						<div className="flex-1 space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<div
									key={`field-${i}`}
									className="bg-white dark:bg-white/5 p-3 rounded-sm space-y-2 shadow-sm"
								>
									<SkeletonLine className="h-3 w-20" />
									<SkeletonLine className="h-5 w-40" />
								</div>
							))}
						</div>
						<div className="flex-1 space-y-4">
							<SkeletonLine className="h-8 w-64" />
							<SkeletonLine className="h-10 w-52" />
							<SkeletonLine className="h-10 w-56" />
						</div>
					</div>
				</SkeletonCard>
			</div>
		</div>
	);
}
