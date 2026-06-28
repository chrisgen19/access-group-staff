import { UserAvatar } from "@/components/shared/user-avatar";
import type { TeamGroup } from "@/lib/team";
import { cn } from "@/lib/utils";

export function TeamGroups({
	groups,
	viewerUserId,
}: {
	groups: TeamGroup[];
	viewerUserId: string;
}) {
	return (
		<div className="space-y-6">
			{groups.map((group) => (
				<section
					key={group.subDepartmentId ?? "__none__"}
					className={cn(
						"overflow-hidden rounded-[2rem] border bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]",
						group.isViewerTeam
							? "border-primary/30 ring-1 ring-primary/15"
							: "border-gray-200/60 dark:border-white/10",
					)}
				>
					<div className="flex items-center justify-between gap-3 px-6 pt-6 pb-3 sm:px-8">
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

					<div className="grid grid-cols-1 gap-px bg-gray-200/60 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
						{group.members.map((member) => {
							const fullName = `${member.firstName} ${member.lastName}`;
							const isViewer = member.id === viewerUserId;
							return (
								<div key={member.id} className="flex items-center gap-3 bg-card px-6 py-4 sm:px-8">
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
											{fullName}
											{isViewer && (
												<span className="ml-2 text-xs font-normal text-muted-foreground">
													(You)
												</span>
											)}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{member.position ?? member.email}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}
