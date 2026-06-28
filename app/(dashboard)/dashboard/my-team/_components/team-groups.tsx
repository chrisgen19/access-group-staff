import { UserAvatar } from "@/components/shared/user-avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { TeamGroup } from "@/lib/team";
import { cn } from "@/lib/utils";

const BRANCH_LABELS: Record<string, string> = {
	ISO: "ISO",
	PERTH: "Perth",
};

function formatBranch(branch: string | null): string {
	if (!branch) return "—";
	return BRANCH_LABELS[branch] ?? branch;
}

export function TeamGroups({
	groups,
	viewerUserId,
}: {
	groups: TeamGroup[];
	viewerUserId: string;
}) {
	return (
		<div className="space-y-8">
			{groups.map((group) => (
				<section key={group.subDepartmentId ?? "__none__"} className="space-y-3">
					<div className="flex items-center justify-between gap-3 px-1">
						<div className="flex items-center gap-3">
							<h2 className="text-[1.15rem] font-medium text-foreground">{group.name}</h2>
							{group.isViewerTeam && (
								<span className="rounded-full bg-[oklch(0.96_0.03_18)] px-3 py-1 text-xs font-medium text-primary dark:bg-primary/15">
									Your team
								</span>
							)}
						</div>
						<span className="text-sm text-muted-foreground">
							{group.members.length} {group.members.length === 1 ? "member" : "members"}
						</span>
					</div>

					<div
						className={cn(
							"overflow-hidden rounded-xl border bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]",
							group.isViewerTeam
								? "border-primary/30 ring-1 ring-primary/15"
								: "border-gray-200/60 dark:border-white/10",
						)}
					>
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30 hover:bg-muted/30">
									<TableHead>Employee</TableHead>
									<TableHead>Position</TableHead>
									<TableHead>Branch</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{group.members.map((member) => {
									const isViewer = member.id === viewerUserId;
									return (
										<TableRow key={member.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<UserAvatar
														firstName={member.firstName}
														lastName={member.lastName}
														avatar={member.avatar}
														image={member.image}
														size="lg"
														className="border border-gray-100 bg-background text-primary dark:border-white/10"
													/>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium text-foreground">
															{member.firstName} {member.lastName}
															{isViewer && (
																<span className="ml-2 text-xs font-normal text-muted-foreground">
																	(You)
																</span>
															)}
														</p>
														<p className="truncate text-xs text-muted-foreground">{member.email}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm text-foreground">{member.position ?? "—"}</span>
											</TableCell>
											<TableCell>
												<span className="text-sm text-foreground">
													{formatBranch(member.branch)}
												</span>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</section>
			))}
		</div>
	);
}
