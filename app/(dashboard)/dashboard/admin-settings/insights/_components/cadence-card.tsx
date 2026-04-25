import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CadencePoint } from "@/lib/insights/queries";

const MIN_BAR_HEIGHT_PCT = 6;

function formatLabel(dayKey: string): string {
	const [, m, d] = dayKey.split("-").map(Number);
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	return `${monthNames[((m ?? 1) - 1) % 12]} ${d ?? ""}`;
}

interface CadenceCardProps {
	data: CadencePoint[];
	daysBack: number;
}

export function CadenceCard({ data, daysBack }: CadenceCardProps) {
	const total = data.reduce((sum, p) => sum + p.count, 0);
	const max = data.reduce((m, p) => Math.max(m, p.count), 0);
	const peak = data.reduce<CadencePoint | null>(
		(best, p) => (best && best.count >= p.count ? best : p),
		null,
	);
	const firstLabel = data[0]?.day ? formatLabel(data[0].day) : null;
	const lastLabel = data.at(-1)?.day ? formatLabel(data.at(-1)?.day ?? "") : null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Card cadence</CardTitle>
				<CardDescription>Recognition cards created in the last {daysBack} days.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
					<div>
						<span className="text-2xl font-semibold tabular-nums">{total}</span>
						<span className="ml-1 text-sm text-muted-foreground">total</span>
					</div>
					{peak && peak.count > 0 ? (
						<div className="text-sm text-muted-foreground">
							Peak <span className="font-medium text-foreground tabular-nums">{peak.count}</span> on{" "}
							<span className="font-medium text-foreground">{formatLabel(peak.day)}</span>
						</div>
					) : null}
				</div>

				{total === 0 ? (
					<p className="text-sm text-muted-foreground">No cards created in this window yet.</p>
				) : (
					<>
						<div
							className="flex h-24 items-end gap-[3px]"
							role="img"
							aria-label={`Card cadence sparkline, ${data.length} days, peak ${max}`}
						>
							{data.map((p) => {
								const heightPct =
									p.count === 0 ? 0 : Math.max((p.count / max) * 100, MIN_BAR_HEIGHT_PCT);
								return (
									<div
										key={p.day}
										className="flex-1 rounded-sm bg-primary/15 hover:bg-primary/30 transition-colors"
										style={{ height: `${heightPct}%` }}
										title={`${formatLabel(p.day)}: ${p.count}`}
									/>
								);
							})}
						</div>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>{firstLabel}</span>
							<span>{lastLabel}</span>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
