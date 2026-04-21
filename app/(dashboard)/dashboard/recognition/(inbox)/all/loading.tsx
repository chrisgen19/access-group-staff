import { SkeletonLine } from "@/components/shared/skeleton-primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function RecognitionAllLoading() {
	return (
		<div
			className="space-y-6 animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading recognition cards"
		>
			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card p-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
					<SkeletonLine className="h-9 w-full lg:w-64 rounded-full" />
					<div className="flex flex-wrap gap-1.5">
						{["v0", "v1", "v2", "v3", "v4"].map((key) => (
							<SkeletonLine key={key} className="h-7 w-20 rounded-full" />
						))}
					</div>
					<div className="flex items-center gap-2 lg:ml-auto">
						<SkeletonLine className="h-9 w-24 rounded-lg" />
						<SkeletonLine className="h-9 w-20 rounded-lg" />
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<SkeletonLine className="h-9 w-24 rounded-md" />
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30 hover:bg-muted/30">
							<TableHead>
								<SkeletonLine className="h-3 w-10" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-8" />
							</TableHead>
							<TableHead className="w-full">
								<SkeletonLine className="h-3 w-16" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-12" />
							</TableHead>
							<TableHead>
								<SkeletonLine className="h-3 w-10" />
							</TableHead>
							<TableHead className="text-right">
								<SkeletonLine className="h-3 w-14 ml-auto" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{["r0", "r1", "r2", "r3", "r4"].map((key) => (
							<TableRow key={key}>
								<TableCell>
									<div className="flex items-center gap-2">
										<SkeletonLine className="h-8 w-8 rounded-full shrink-0" />
										<div className="space-y-1 min-w-0">
											<SkeletonLine className="h-4 w-24" />
											<SkeletonLine className="h-3 w-16" />
										</div>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<SkeletonLine className="h-8 w-8 rounded-full shrink-0" />
										<div className="space-y-1 min-w-0">
											<SkeletonLine className="h-4 w-24" />
											<SkeletonLine className="h-3 w-16" />
										</div>
									</div>
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-48" />
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										<SkeletonLine className="h-5 w-14 rounded-full" />
										<SkeletonLine className="h-5 w-16 rounded-full" />
									</div>
								</TableCell>
								<TableCell>
									<SkeletonLine className="h-4 w-20" />
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-1">
										<SkeletonLine className="h-8 w-8 rounded-full" />
										<SkeletonLine className="h-8 w-8 rounded-full" />
										<SkeletonLine className="h-8 w-8 rounded-full" />
										<SkeletonLine className="h-8 w-8 rounded-full" />
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
