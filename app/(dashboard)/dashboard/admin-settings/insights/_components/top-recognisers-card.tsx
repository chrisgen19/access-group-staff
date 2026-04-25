import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopRecogniser } from "@/lib/insights/queries";

interface TopRecognisersCardProps {
	data: TopRecogniser[];
	daysBack: number;
}

export function TopRecognisersCard({ data, daysBack }: TopRecognisersCardProps) {
	const max = data.reduce((m, r) => Math.max(m, r.count), 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Top recognisers</CardTitle>
				<CardDescription>
					Who's sending the most recognition cards in the last {daysBack} days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No recognition activity in this window yet.
					</p>
				) : (
					<ol className="space-y-3">
						{data.map((r, i) => {
							const widthPct = max === 0 ? 0 : (r.count / max) * 100;
							return (
								<li
									key={r.userId}
									className="grid grid-cols-[1.5rem_2.25rem_1fr_auto] items-center gap-3"
								>
									<span className="text-sm font-medium text-muted-foreground tabular-nums">
										{i + 1}
									</span>
									<UserAvatar
										firstName={r.firstName}
										lastName={r.lastName}
										avatar={r.avatar}
										size="sm"
									/>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">
											{r.firstName} {r.lastName}
										</p>
										<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-primary/60"
												style={{ width: `${widthPct}%` }}
											/>
										</div>
									</div>
									<span className="text-sm text-muted-foreground tabular-nums">{r.count}</span>
								</li>
							);
						})}
					</ol>
				)}
			</CardContent>
		</Card>
	);
}
