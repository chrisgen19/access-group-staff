import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function NewUserLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading new user form"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-20" />
					<SkeletonLine className="h-10 w-64" />
					<SkeletonLine className="h-4 w-96" />
				</div>
			</div>
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2 space-y-2">
					<SkeletonLine className="h-8 w-56" />
					<SkeletonLine className="h-4 w-80" />
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
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{["g0", "g1"].map((key) => (
							<div key={key} className="space-y-2">
								<SkeletonLine className="h-4 w-28" />
								<SkeletonLine className="h-12 w-full rounded-xl" />
							</div>
						))}
					</div>
				</div>
				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end gap-3">
					<SkeletonLine className="h-10 w-24 rounded-full" />
					<SkeletonLine className="h-10 w-32 rounded-full" />
				</div>
			</SkeletonCard>
		</div>
	);
}
