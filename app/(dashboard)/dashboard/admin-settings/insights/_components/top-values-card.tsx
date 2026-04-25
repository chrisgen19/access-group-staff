import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ValueTally } from "@/lib/insights/queries";

const VALUE_LABELS: Record<string, string> = {
	PEOPLE: "People",
	SAFETY: "Safety",
	RESPECT: "Respect",
	COMMUNICATION: "Communication",
	CONTINUOUS_IMPROVEMENT: "Continuous Improvement",
};

interface TopValuesCardProps {
	data: ValueTally[];
	daysBack: number;
}

export function TopValuesCard({ data, daysBack }: TopValuesCardProps) {
	const total = data.reduce((sum, v) => sum + v.count, 0);
	const max = data[0]?.count ?? 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Top company values</CardTitle>
				<CardDescription>
					Values picked across recognition cards in the last {daysBack} days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{total === 0 ? (
					<p className="text-sm text-muted-foreground">No values tagged in this window yet.</p>
				) : (
					<ul className="space-y-3">
						{data.map((v) => {
							const widthPct = max === 0 ? 0 : (v.count / max) * 100;
							const sharePct = total === 0 ? 0 : Math.round((v.count / total) * 100);
							return (
								<li key={v.value} className="grid grid-cols-[10rem_1fr_auto] items-center gap-3">
									<span className="truncate text-sm font-medium">
										{VALUE_LABELS[v.value] ?? v.value}
									</span>
									<div className="h-2 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary/60"
											style={{ width: `${widthPct}%` }}
										/>
									</div>
									<span className="text-sm text-muted-foreground tabular-nums">
										{v.count} <span className="text-xs">({sharePct}%)</span>
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
