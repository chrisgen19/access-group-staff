import { SkeletonCard, SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function DepartmentsLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading departments"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-3">
						<SkeletonLine className="h-3 w-24" />
						<SkeletonLine className="h-10 w-48" />
						<SkeletonLine className="h-5 w-80" />
					</div>
					<SkeletonLine className="h-12 w-48 rounded-full" />
				</div>
			</div>

			{/* Department table */}
			<SkeletonCard className="overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
						<thead>
							<tr>
								<th className="px-8 py-4 text-left w-full">
									<SkeletonLine className="h-3 w-12" />
								</th>
								<th className="px-8 py-4 text-left">
									<SkeletonLine className="h-3 w-10" />
								</th>
								<th className="px-8 py-4 text-left">
									<SkeletonLine className="h-3 w-12" />
								</th>
								<th className="px-8 py-4 w-[100px]">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200/60 dark:divide-white/10">
							{["d0", "d1", "d2", "d3"].map((key) => (
								<tr key={key}>
									<td className="px-8 py-5">
										<SkeletonLine className="h-4 w-40" />
									</td>
									<td className="px-8 py-5">
										<SkeletonLine className="h-4 w-20" />
									</td>
									<td className="px-8 py-5">
										<SkeletonLine className="h-4 w-8" />
									</td>
									<td className="px-8 py-5">
										<div className="flex justify-end gap-1">
											<SkeletonLine className="h-8 w-8 rounded-full" />
											<SkeletonLine className="h-8 w-8 rounded-full" />
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</SkeletonCard>
		</div>
	);
}
