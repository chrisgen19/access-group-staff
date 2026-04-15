import { cn } from "@/lib/utils";

const SKELETON_BG = "bg-gray-200 dark:bg-white/10";

function SkeletonLine({ className }: { className?: string }) {
	return <div className={cn(SKELETON_BG, "rounded", className)} />;
}

function SkeletonPageHeader({
	action,
	className,
}: {
	action?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
		>
			<div className="space-y-3">
				<SkeletonLine className="h-10 w-72" />
				<SkeletonLine className="h-5 w-48" />
			</div>
			{action && <SkeletonLine className="h-12 w-52 rounded-full" />}
		</div>
	);
}

function SkeletonCard({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]",
				className,
			)}
		>
			{children}
		</div>
	);
}

function SkeletonFormCard({
	fieldCount = 5,
	hasFooter = true,
	title,
}: {
	fieldCount?: number;
	hasFooter?: boolean;
	title?: boolean;
}) {
	return (
		<SkeletonCard className="overflow-hidden">
			{title && (
				<div className="px-8 pt-8 pb-2">
					<SkeletonLine className="h-6 w-40" />
				</div>
			)}
			<div className={cn("px-8 py-6 space-y-5", !title && "pt-8")}>
				{Array.from({ length: fieldCount }).map((_, i) => (
					<div key={`field-${i}`} className="space-y-2">
						<SkeletonLine className="h-4 w-24" />
						<SkeletonLine className="h-12 w-full rounded-xl" />
					</div>
				))}
			</div>
			{hasFooter && (
				<div className="px-8 py-6 border-t border-gray-200/60 dark:border-white/10 flex justify-end gap-3">
					<SkeletonLine className="h-10 w-24 rounded-lg" />
					<SkeletonLine className="h-10 w-32 rounded-lg" />
				</div>
			)}
		</SkeletonCard>
	);
}

export { SkeletonLine, SkeletonPageHeader, SkeletonCard, SkeletonFormCard };
