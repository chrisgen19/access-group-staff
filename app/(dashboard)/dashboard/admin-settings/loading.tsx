import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

function SettingsPanelSkeleton({
	titleWidth,
	subtitleWidth,
	rowCount = 1,
	children,
}: {
	titleWidth: string;
	subtitleWidth: string;
	rowCount?: number;
	children?: React.ReactNode;
}) {
	return (
		<SkeletonCard className="overflow-hidden">
			<div className="px-8 pt-8 pb-2 space-y-2">
				<SkeletonLine className={`h-7 ${titleWidth}`} />
				<SkeletonLine className={`h-4 ${subtitleWidth}`} />
			</div>
			<div className="px-8 py-6 space-y-4">
				{children ??
					Array.from({ length: rowCount }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows, no stable identity
							key={i}
							className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/10 p-5 gap-4"
						>
							<div className="space-y-2 min-w-0 flex-1">
								<SkeletonLine className="h-4 w-48" />
								<SkeletonLine className="h-3 w-64" />
							</div>
							<SkeletonLine className="h-9 w-20 rounded-md shrink-0" />
						</div>
					))}
			</div>
		</SkeletonCard>
	);
}

export default function AdminSettingsLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading admin settings"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="space-y-3">
					<SkeletonLine className="h-3 w-28" />
					<SkeletonLine className="h-10 w-52" />
					<SkeletonLine className="h-5 w-80" />
				</div>
			</div>

			{/* Recognition Settings */}
			<SettingsPanelSkeleton titleWidth="w-56" subtitleWidth="w-80" rowCount={1} />

			{/* Leaderboard Visibility */}
			<SettingsPanelSkeleton titleWidth="w-60" subtitleWidth="w-96">
				<div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/10 p-5 gap-4">
					<div className="space-y-2 min-w-0 flex-1">
						<SkeletonLine className="h-4 w-40" />
						<SkeletonLine className="h-3 w-72" />
					</div>
					<SkeletonLine className="h-9 w-44 rounded-md shrink-0" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-24" />
						<SkeletonLine className="h-10 w-full rounded-md" />
					</div>
					<div className="space-y-2">
						<SkeletonLine className="h-4 w-24" />
						<SkeletonLine className="h-10 w-full rounded-md" />
					</div>
				</div>
			</SettingsPanelSkeleton>

			{/* Help Me Module */}
			<SettingsPanelSkeleton titleWidth="w-40" subtitleWidth="w-72">
				<div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/10 p-5 gap-4">
					<div className="space-y-2 min-w-0 flex-1">
						<SkeletonLine className="h-4 w-32" />
						<SkeletonLine className="h-3 w-80" />
					</div>
					<SkeletonLine className="h-6 w-11 rounded-full shrink-0" />
				</div>
			</SettingsPanelSkeleton>
		</div>
	);
}
