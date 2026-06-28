"use client";

import { Check, Loader2, Search, UserMinus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	assignTeamLeaderAction,
	getDepartmentMembersAction,
} from "@/lib/actions/department-actions";
import { cn } from "@/lib/utils";

interface Member {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	image: string | null;
	position: string | null;
}

interface TeamLeaderPickerProps {
	subDepartmentId: string;
	subDepartmentName: string;
	departmentId: string;
	currentLeaderId: string | null;
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function TeamLeaderPicker({
	subDepartmentId,
	subDepartmentName,
	departmentId,
	currentLeaderId,
	open,
	onClose,
	onSuccess,
}: TeamLeaderPickerProps) {
	const [members, setMembers] = useState<Member[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		let active = true;
		setIsLoading(true);
		setSearch("");
		setMembers([]);
		getDepartmentMembersAction(departmentId)
			.then((result) => {
				if (!active) return;
				if (result.success) {
					setMembers(result.data);
				} else {
					setMembers([]);
					toast.error(typeof result.error === "string" ? result.error : "Failed to load members");
				}
			})
			.catch(() => {
				if (!active) return;
				setMembers([]);
				toast.error("Failed to load members");
			})
			.finally(() => {
				if (active) setIsLoading(false);
			});
		return () => {
			active = false;
		};
	}, [open, departmentId]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return members;
		return members.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q));
	}, [members, search]);

	async function assign(userId: string | null) {
		setPendingId(userId ?? "__remove__");
		try {
			const result = await assignTeamLeaderAction(subDepartmentId, userId);
			if (!result.success) {
				toast.error(typeof result.error === "string" ? result.error : "Failed to assign leader");
				return;
			}
			toast.success(userId ? "Team leader assigned" : "Team leader removed");
			onClose();
			onSuccess?.();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setPendingId(null);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="max-w-lg gap-0 rounded-[2rem] p-0 ring-0 border border-gray-100 dark:border-white/5 shadow-2xl"
				showCloseButton={false}
			>
				<DialogHeader className="px-8 pt-8 pb-2">
					<DialogTitle className="text-[1.5rem] leading-tight font-medium tracking-tight">
						Team Leader
					</DialogTitle>
					<p className="text-sm text-muted-foreground">{subDepartmentName}</p>
				</DialogHeader>

				<div className="px-8 pt-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search department members…"
							className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/30 dark:border-white/10 dark:bg-white/5"
						/>
					</div>
				</div>

				<div className="max-h-[22rem] overflow-y-auto px-4 py-4">
					{currentLeaderId && (
						<button
							type="button"
							onClick={() => assign(null)}
							disabled={pendingId !== null}
							className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-[oklch(0.96_0.03_18)] hover:text-primary disabled:opacity-50 dark:hover:bg-primary/10"
						>
							<span className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
								{pendingId === "__remove__" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<UserMinus className="h-4 w-4" />
								)}
							</span>
							Remove current leader
						</button>
					)}

					{isLoading ? (
						<div className="flex items-center justify-center py-12 text-muted-foreground">
							<Loader2 className="h-5 w-5 animate-spin" />
						</div>
					) : filtered.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							{members.length === 0 ? "No members in this department." : "No matching members."}
						</p>
					) : (
						<ul className="space-y-1">
							{filtered.map((member) => {
								const isCurrent = member.id === currentLeaderId;
								return (
									<li key={member.id}>
										<button
											type="button"
											onClick={() => assign(member.id)}
											disabled={pendingId !== null || isCurrent}
											className={cn(
												"flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-colors disabled:cursor-default",
												isCurrent
													? "bg-[oklch(0.96_0.03_18)] dark:bg-primary/10"
													: "hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5",
											)}
										>
											<UserAvatar
												firstName={member.firstName}
												lastName={member.lastName}
												avatar={member.avatar}
												image={member.image}
												size="lg"
												className="border border-gray-100 bg-background text-primary dark:border-white/10"
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-foreground">
													{member.firstName} {member.lastName}
												</p>
												<p className="truncate text-xs text-muted-foreground">
													{member.position ?? "—"}
												</p>
											</div>
											{pendingId === member.id ? (
												<Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
											) : isCurrent ? (
												<Check className="h-4 w-4 shrink-0 text-primary" />
											) : null}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="flex justify-end border-t border-gray-200/60 bg-gray-50/50 px-8 py-5 rounded-b-[2rem] dark:border-white/10 dark:bg-white/[0.02]">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex justify-center rounded-full border border-gray-200 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-white/10 dark:hover:bg-white/5 dark:focus:ring-white/10"
					>
						Close
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
