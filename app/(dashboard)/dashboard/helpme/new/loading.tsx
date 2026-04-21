import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function NewTicketLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-6 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading new ticket form"
		>
			{/* Back link */}
			<SkeletonLine className="h-4 w-32" />

			{/* Page header */}
			<div className="space-y-3">
				<SkeletonLine className="h-10 w-56" />
				<SkeletonLine className="h-5 w-96" />
			</div>

			{/* Form card */}
			<div className="max-w-3xl">
				<div className="space-y-5 rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card p-8 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-24" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-20" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-16" />
						<SkeletonLine className="h-48 w-full rounded-xl" />
					</div>
					<div className="flex justify-end">
						<SkeletonLine className="h-10 w-32 rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
