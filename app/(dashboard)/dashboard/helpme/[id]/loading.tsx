import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function TicketDetailLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-6 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading ticket"
		>
			<SkeletonLine className="h-4 w-32" />

			<div className="max-w-4xl space-y-6">
				{/* Ticket header card */}
				<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] space-y-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-2 flex-1 min-w-0">
							<SkeletonLine className="h-7 w-80 max-w-full" />
							<SkeletonLine className="h-4 w-64" />
						</div>
						<div className="flex items-center gap-2">
							<SkeletonLine className="h-5 w-16 rounded-full" />
							<SkeletonLine className="h-5 w-20 rounded-full" />
						</div>
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-full" />
						<SkeletonLine className="h-4 w-5/6" />
						<SkeletonLine className="h-4 w-2/3" />
					</div>
				</div>

				{/* Replies */}
				<div className="space-y-3">
					<SkeletonLine className="h-4 w-24" />
					{["r0", "r1"].map((key) => (
						<div
							key={key}
							className="rounded-[1.5rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] space-y-3"
						>
							<div className="flex items-center gap-3">
								<SkeletonLine className="h-10 w-10 rounded-full shrink-0" />
								<div className="space-y-1">
									<SkeletonLine className="h-4 w-32" />
									<SkeletonLine className="h-3 w-24" />
								</div>
							</div>
							<div className="space-y-2">
								<SkeletonLine className="h-4 w-full" />
								<SkeletonLine className="h-4 w-4/5" />
							</div>
						</div>
					))}
				</div>

				{/* Reply form */}
				<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
					<SkeletonLine className="h-4 w-32" />
					<SkeletonLine className="h-32 w-full rounded-xl" />
					<div className="flex justify-end">
						<SkeletonLine className="h-10 w-32 rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
