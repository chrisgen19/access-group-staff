import { SkeletonLine, SkeletonPageHeader } from "@/components/shared/skeleton-primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function MyTeamLoading() {
	return (
		<div
			className="mx-auto max-w-5xl space-y-8 animate-pulse sm:space-y-8"
			role="status"
			aria-busy="true"
			aria-label="Loading team"
		>
			<SkeletonPageHeader />

			{["g0", "g1"].map((group) => (
				<section key={group} className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<SkeletonLine className="h-5 w-40" />
						<SkeletonLine className="h-4 w-20" />
					</div>
					<div className="overflow-hidden rounded-xl border border-gray-200/60 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] dark:border-white/10">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30 hover:bg-muted/30">
									<TableHead>
										<SkeletonLine className="h-3 w-20" />
									</TableHead>
									<TableHead>
										<SkeletonLine className="h-3 w-16" />
									</TableHead>
									<TableHead>
										<SkeletonLine className="h-3 w-14" />
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{["r0", "r1", "r2"].map((row) => (
									<TableRow key={row}>
										<TableCell>
											<div className="flex items-center gap-3">
												<SkeletonLine className="h-10 w-10 shrink-0 rounded-full" />
												<div className="min-w-0 space-y-1.5">
													<SkeletonLine className="h-4 w-32" />
													<SkeletonLine className="h-3 w-40" />
												</div>
											</div>
										</TableCell>
										<TableCell>
											<SkeletonLine className="h-4 w-24" />
										</TableCell>
										<TableCell>
											<SkeletonLine className="h-4 w-16" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</section>
			))}
		</div>
	);
}
