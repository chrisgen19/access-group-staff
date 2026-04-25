import type { TicketCategory } from "@/app/generated/prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryTally } from "@/lib/insights/queries";

// Typed against the enum so a future `TicketCategory` value (e.g. LEGAL)
// fails the build here rather than rendering as the raw enum string.
const CATEGORY_LABELS: Record<TicketCategory, string> = {
	HR: "HR",
	IT_WEBSITE: "IT / Website",
	PAYROLL: "Payroll",
	FACILITIES: "Facilities",
	OTHER: "Other",
};

interface CategoryMixCardProps {
	data: CategoryTally[];
	daysBack: number;
}

export function CategoryMixCard({ data, daysBack }: CategoryMixCardProps) {
	const total = data.reduce((sum, c) => sum + c.count, 0);
	const max = data.reduce((m, c) => Math.max(m, c.count), 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Help Me category mix</CardTitle>
				<CardDescription>Tickets created by category in the last {daysBack} days.</CardDescription>
			</CardHeader>
			<CardContent>
				{total === 0 ? (
					<p className="text-sm text-muted-foreground">No tickets created in this window yet.</p>
				) : (
					<ul className="space-y-3">
						{data.map((c) => {
							const widthPct = max === 0 ? 0 : (c.count / max) * 100;
							const sharePct = total === 0 ? 0 : Math.round((c.count / total) * 100);
							return (
								<li key={c.category} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3">
									<span className="truncate text-sm font-medium">
										{CATEGORY_LABELS[c.category]}
									</span>
									<div className="h-2 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary/60"
											style={{ width: `${widthPct}%` }}
										/>
									</div>
									<span className="text-sm text-muted-foreground tabular-nums">
										{c.count} <span className="text-xs">({sharePct}%)</span>
									</span>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
