import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function InsightsLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading insights"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-28" />
					<SkeletonLine className="h-10 w-48" />
					<SkeletonLine className="h-5 w-96" />
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{["c0", "c1"].map((key) => (
					<div key={key} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 space-y-4">
						<SkeletonLine className="h-4 w-32" />
						<SkeletonLine className="h-3 w-64" />
						<SkeletonLine className="h-24 w-full rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}
