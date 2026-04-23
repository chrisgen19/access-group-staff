import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function TicketDetailLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading ticket"
		>
			<SkeletonLine className="h-10 w-36 rounded-full" />

			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-20" />
					<SkeletonLine className="h-10 w-80 max-w-full" />
					<SkeletonLine className="h-4 w-64" />
				</div>
				<div className="mt-3 flex items-center gap-2">
					<SkeletonLine className="h-5 w-16 rounded-full" />
					<SkeletonLine className="h-5 w-20 rounded-full" />
				</div>
			</div>

			<div className="max-w-4xl space-y-6">
				{/* Ticket header card */}
				<div className="space-y-5 rounded-[2rem] border border-gray-200/60 bg-card p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] dark:border-white/10">
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
							className="space-y-3 rounded-[1.5rem] border border-gray-200/60 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] dark:border-white/10"
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
				<div className="space-y-4 rounded-[2rem] border border-gray-200/60 bg-card p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] dark:border-white/10">
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
