import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function ProfileLoading() {
	return (
		<div
			className="space-y-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading profile"
		>
			{/* Avatar card */}
			<SkeletonCard className="px-8 py-6">
				<div className="flex items-center gap-6">
					<SkeletonLine className="h-20 w-20 rounded-full shrink-0" />
					<div className="flex flex-col gap-2 flex-1">
						<SkeletonLine className="h-4 w-32" />
						<SkeletonLine className="h-3 w-64" />
						<div className="flex gap-2 mt-1">
							<SkeletonLine className="h-7 w-32 rounded-full" />
							<SkeletonLine className="h-7 w-24 rounded-full" />
						</div>
					</div>
				</div>
			</SkeletonCard>

			{/* Edit Profile form card */}
			<SkeletonCard className="overflow-hidden">
				<div className="px-8 pt-8 pb-2">
					<SkeletonLine className="h-8 w-40" />
				</div>
				<div className="px-8 py-6 space-y-5">
					<div className="grid grid-cols-2 gap-5">
						{["first", "last"].map((key) => (
							<div key={key} className="space-y-2">
								<SkeletonLine className="h-4 w-24" />
								<SkeletonLine className="h-12 w-full rounded-xl" />
							</div>
						))}
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-28" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
					<div className="grid grid-cols-2 gap-5">
						{["phone", "position"].map((key) => (
							<div key={key} className="space-y-2">
								<SkeletonLine className="h-4 w-20" />
								<SkeletonLine className="h-12 w-full rounded-xl" />
							</div>
						))}
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-16" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
				</div>
				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end">
					<SkeletonLine className="h-10 w-32 rounded-full" />
				</div>
			</SkeletonCard>

			{/* Recognition history card */}
			<SkeletonCard className="px-8 py-6 space-y-2">
				<SkeletonLine className="h-6 w-48" />
				<SkeletonLine className="h-3 w-20" />
				<div className="grid grid-cols-2 gap-4 mt-6">
					{["sent", "received"].map((key) => (
						<div key={key} className="flex items-center gap-3">
							<SkeletonLine className="h-10 w-10 rounded-full" />
							<div className="space-y-1">
								<SkeletonLine className="h-7 w-12" />
								<SkeletonLine className="h-3 w-24" />
							</div>
						</div>
					))}
				</div>
			</SkeletonCard>
		</div>
	);
}
