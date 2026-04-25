import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngagedCard } from "@/lib/insights/queries";

interface EngagedCardsCardProps {
	data: EngagedCard[];
	daysBack: number;
}

function truncate(message: string, max = 90): string {
	const trimmed = message.trim().replace(/\s+/g, " ");
	// Slice by codepoints, not UTF-16 code units, so multi-codepoint emoji at
	// the boundary don't render as a broken half-character.
	const codepoints = Array.from(trimmed);
	return codepoints.length <= max ? trimmed : `${codepoints.slice(0, max - 1).join("")}…`;
}

function fullName(user: { firstName: string; lastName: string } | null): string {
	if (!user) return "Former employee";
	return `${user.firstName} ${user.lastName}`.trim() || "Unknown";
}

export function EngagedCardsCard({ data, daysBack }: EngagedCardsCardProps) {
	const max = data.reduce((m, c) => Math.max(m, c.total), 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Most-engaged cards</CardTitle>
				<CardDescription>
					Recognition cards with the most reactions and comments in the last {daysBack} days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<p className="text-sm text-muted-foreground">No engagement in this window yet.</p>
				) : (
					<ol className="space-y-4">
						{data.map((c, i) => {
							const widthPct = max === 0 ? 0 : (c.total / max) * 100;
							return (
								<li key={c.cardId} className="space-y-2">
									<div className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-3">
										<span className="pt-0.5 text-sm font-medium text-muted-foreground tabular-nums">
											{i + 1}
										</span>
										<div className="min-w-0 space-y-1">
											<p className="line-clamp-2 text-sm">{truncate(c.message)}</p>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<UserAvatar
													firstName={c.sender?.firstName ?? "?"}
													lastName={c.sender?.lastName ?? ""}
													avatar={c.sender?.avatar ?? null}
													size="sm"
												/>
												<span className="truncate">
													{fullName(c.sender)}
													<span className="mx-1 text-muted-foreground/60">→</span>
													{fullName(c.recipient)}
												</span>
											</div>
										</div>
										<span className="text-sm text-muted-foreground tabular-nums">
											{c.total}
											<span className="ml-1 text-xs">
												({c.reactions}♡ · {c.comments}💬)
											</span>
										</span>
									</div>
									<div className="ml-9 h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary/60"
											style={{ width: `${widthPct}%` }}
										/>
									</div>
								</li>
							);
						})}
					</ol>
				)}
			</CardContent>
		</Card>
	);
}
