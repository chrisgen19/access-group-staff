import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function LoginLoading() {
	return (
		<div className="w-full max-w-md animate-pulse" aria-busy="true" aria-label="Loading login form">
			{/* Logo + heading */}
			<div className="flex flex-col items-center mb-8">
				<SkeletonLine className="h-10 w-32" />
				<SkeletonLine className="mt-8 h-9 w-48" />
				<SkeletonLine className="mt-3 h-4 w-44" />
			</div>

			{/* Form card */}
			<div className="bg-card py-10 px-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] rounded-[2rem] sm:px-12 border border-gray-200/60 dark:border-white/10">
				<div className="space-y-6">
					{/* OAuth button */}
					<SkeletonLine className="h-[52px] w-full rounded-full" />

					{/* Divider */}
					<div className="flex items-center gap-3">
						<SkeletonLine className="h-px flex-1" />
						<SkeletonLine className="h-3 w-28" />
						<SkeletonLine className="h-px flex-1" />
					</div>

					{/* Email input */}
					<div className="space-y-1.5">
						<SkeletonLine className="h-4 w-28 ml-1" />
						<SkeletonLine className="h-[52px] w-full rounded-xl" />
					</div>

					{/* Password input */}
					<div className="space-y-1.5">
						<SkeletonLine className="h-4 w-20 ml-1" />
						<SkeletonLine className="h-[52px] w-full rounded-xl" />
					</div>

					{/* Submit button */}
					<div className="pt-2">
						<SkeletonLine className="h-[52px] w-full rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
