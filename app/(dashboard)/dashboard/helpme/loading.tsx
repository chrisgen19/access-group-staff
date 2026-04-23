import { SkeletonLine } from "@/components/shared/skeleton-primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function HelpMeLoading() {
	return (
		<div
			className="mx-auto max-w-7xl space-y-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading Help Me tickets"
		>
			<div className="rounded-[2rem] border border-gray-200/60 bg-card px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 sm:px-7 sm:py-6">
				<div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-3">
						<SkeletonLine className="h-3 w-20" />
						<SkeletonLine className="h-10 w-48" />
						<SkeletonLine className="h-5 w-80" />
					</div>
					<SkeletonLine className="h-12 w-40 rounded-full" />
				</div>
			</div>

			{/* Tickets table */}
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30 hover:bg-muted/30">
							<TableHead className="w-full">
								<SkeletonLine className="h-3 w-16" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-16" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-12" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-14" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-14" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{["t0", "t1", "t2", "t3", "t4"].map((key) => (
							<TableRow key={key}>
								<TableCell>
									<SkeletonLine className="h-4 w-64" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-5 w-20 rounded-full" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-5 w-16 rounded-full" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-6" />
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-24" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
