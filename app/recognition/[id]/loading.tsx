import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function PublicRecognitionLoading() {
	return (
		<div
			className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center py-8 px-4 animate-pulse"
			aria-busy="true"
			aria-label="Loading recognition card"
		>
			{/* FlipCard placeholder */}
			<div className="w-full max-w-5xl bg-[#e6e7e8] shadow-2xl">
				<div className="bg-gray-300/60 h-28" />
				<div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
					<div className="flex-1 space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={`field-${i}`}
								className="bg-white p-3 rounded-sm space-y-2 shadow-sm"
							>
								<SkeletonLine className="h-3 w-20" />
								<SkeletonLine className="h-5 w-40" />
							</div>
						))}
					</div>
					<div className="flex-1 space-y-4 flex flex-col justify-center">
						<SkeletonLine className="h-8 w-64" />
						<SkeletonLine className="h-10 w-52" />
						<SkeletonLine className="h-10 w-56" />
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="mt-8">
				<SkeletonLine className="h-4 w-48" />
			</div>
		</div>
	);
}
