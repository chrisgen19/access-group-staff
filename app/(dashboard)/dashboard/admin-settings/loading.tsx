import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

function SettingsPanelSkeleton({
	rowCount = 1,
	children,
}: {
	rowCount?: number;
	children?: React.ReactNode;
}) {
	return (
		<SkeletonCard className="overflow-hidden">
			<div className="px-8 pt-8 pb-2 space-y-2">
				<SkeletonLine className="h-7 w-52" />
				<SkeletonLine className="h-4 w-80" />
			</div>
			<div className="px-8 py-6 space-y-4">
				{children ??
					Array.from({ length: rowCount }, (_, i) => i).map((i) => (
						<div
							key={`setting-row-${i}`}
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
			className="max-w-7xl mx-auto space-y-8 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading admin settings"
		>
			<div className="space-y-3">
				<SkeletonLine className="h-10 w-52" />
				<SkeletonLine className="h-5 w-80" />
			</div>

			<SettingsPanelSkeleton rowCount={1} />

			<SettingsPanelSkeleton>
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

			<SettingsPanelSkeleton>
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
