import { SkeletonLine } from "@/components/shared/skeleton-primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function ActivityLogsLoading() {
	return (
		<div
			className="max-w-7xl mx-auto space-y-8 mt-2 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading activity logs"
		>
			{/* Page header */}
			<div className="space-y-3">
				<SkeletonLine className="h-10 w-48" />
				<SkeletonLine className="h-5 w-96" />
			</div>

			{/* Filters panel */}
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card p-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
					{["f0", "f1", "f2", "f3", "f4"].map((key) => (
						<div key={key} className="space-y-2">
							<SkeletonLine className="h-3 w-16" />
							<SkeletonLine className="h-9 w-full rounded-md" />
						</div>
					))}
				</div>
				<div className="mt-4 flex items-center justify-end">
					<SkeletonLine className="h-8 w-24 rounded-md" />
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30 hover:bg-muted/30">
							<TableHead>
								<SkeletonLine className="h-3 w-12" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-12" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-14" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-12" />
							</TableHead>
							<TableHead className="w-full">
								<SkeletonLine className="h-3 w-16" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-8" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7"].map((key) => (
							<TableRow key={key}>
								<TableCell>
									<SkeletonLine className="h-4 w-28" />
								</TableCell>
								<TableCell>
									<div className="space-y-1">
										<SkeletonLine className="h-4 w-32" />
										<SkeletonLine className="h-3 w-40" />
									</div>
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-5 w-20 rounded-full" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-56" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-16" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between">
				<SkeletonLine className="h-4 w-40" />
				<div className="flex items-center gap-2">
					<SkeletonLine className="h-9 w-24 rounded-md" />
					<SkeletonLine className="h-9 w-24 rounded-md" />
				</div>
			</div>
		</div>
	);
}
