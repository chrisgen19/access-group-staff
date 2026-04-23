import type { ReactNode } from "react";
import { DashboardAccountControls } from "@/components/shared/dashboard-account-controls";
import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
	title: ReactNode;
	description?: ReactNode;
	eyebrow?: ReactNode;
	meta?: ReactNode;
	actions?: ReactNode;
	className?: string;
}

export function DashboardPageHeader({
	title,
	description,
	eyebrow = "Dashboard",
	meta,
	actions,
	className,
}: DashboardPageHeaderProps) {
	return (
		<section
			className={cn(
				"mt-2 overflow-hidden rounded-[2rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(252,248,247,0.98))] px-5 py-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] sm:px-7 sm:py-6",
				className,
			)}
		>
			<div
				className={cn(
					"flex flex-col gap-5 sm:gap-6 lg:flex-row lg:justify-between",
					actions ? "lg:items-end" : "lg:items-start",
				)}
			>
				<div className="min-w-0">
					<p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
						{eyebrow}
					</p>
					<h1 className="mt-3 text-[1.9rem] leading-[1.02] font-medium tracking-tight text-foreground sm:text-[2.35rem]">
						{title}
					</h1>
					{description && (
						<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
							{description}
						</p>
					)}
					{meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
				</div>

				<div className={cn("flex w-full flex-col gap-3 sm:w-auto", actions && "lg:items-end")}>
					<div className="hidden md:flex">
						<DashboardAccountControls />
					</div>
					{actions && (
						<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
							{actions}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
