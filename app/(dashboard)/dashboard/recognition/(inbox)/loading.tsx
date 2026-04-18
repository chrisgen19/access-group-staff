import { SkeletonLine } from "@/components/shared/skeleton-primitives";

export default function RecognitionInboxLoading() {
	return (
		<div
			className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden animate-pulse"
			role="status"
			aria-busy="true"
			aria-label="Loading recognition cards"
		>
			<div className="h-10 bg-muted/30 border-b" />
			{["r0", "r1", "r2", "r3", "r4"].map((key) => (
				<div key={key} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
					<SkeletonLine className="h-4 w-24" />
					<SkeletonLine className="h-4 w-24" />
					<SkeletonLine className="h-4 w-48 flex-1" />
					<SkeletonLine className="h-4 w-20" />
					<SkeletonLine className="h-4 w-20" />
				</div>
			))}
		</div>
	);
}
