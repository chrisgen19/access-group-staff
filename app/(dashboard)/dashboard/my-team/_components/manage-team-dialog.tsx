"use client";

import { Loader2, Plus, Search, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	getLedTeamDataAction,
	setTeamMemberSubDepartmentAction,
} from "@/lib/actions/team-leader-actions";

interface Person {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	image: string | null;
	position: string | null;
	subDepartmentId: string | null;
}

export function ManageTeamDialog({
	subDepartmentId,
	subDepartmentName,
}: {
	subDepartmentId: string;
	subDepartmentName: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [members, setMembers] = useState<Person[]>([]);
	const [assignable, setAssignable] = useState<Person[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [mutated, setMutated] = useState(false);

	const load = useCallback(async () => {
		setIsLoading(true);
		setMembers([]);
		setAssignable([]);
		try {
			const result = await getLedTeamDataAction(subDepartmentId);
			if (result.success) {
				setMembers(result.data.members);
				setAssignable(result.data.assignable);
			} else {
				toast.error(typeof result.error === "string" ? result.error : "Failed to load team");
			}
		} catch {
			toast.error("Failed to load team");
		} finally {
			setIsLoading(false);
		}
	}, [subDepartmentId]);

	useEffect(() => {
		if (!open) return;
		setSearch("");
		setMutated(false);
		load();
	}, [open, load]);

	const filteredAssignable = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return assignable;
		return assignable.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q));
	}, [assignable, search]);

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next && mutated) router.refresh();
	}

	async function move(userId: string, dest: string | null) {
		setPendingId(userId);
		try {
			const result = await setTeamMemberSubDepartmentAction(userId, dest);
			if (!result.success) {
				toast.error(typeof result.error === "string" ? result.error : "Failed to update team");
				return;
			}
			toast.success(dest ? "Member added" : "Member removed");
			setMutated(true);
			await load();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setPendingId(null);
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
			>
				<Users size={14} />
				Manage members
			</button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent
					className="max-w-lg gap-0 rounded-[2rem] p-0 ring-0 border border-gray-100 dark:border-white/5 shadow-2xl"
					showCloseButton={false}
				>
					<DialogHeader className="px-8 pt-8 pb-2">
						<DialogTitle className="text-[1.5rem] leading-tight font-medium tracking-tight">
							Manage Members
						</DialogTitle>
						<p className="text-sm text-muted-foreground">{subDepartmentName}</p>
					</DialogHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-16 text-muted-foreground">
							<Loader2 className="h-5 w-5 animate-spin" />
						</div>
					) : (
						<div className="max-h-[26rem] space-y-6 overflow-y-auto px-4 py-4">
							<section>
								<h3 className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									Members ({members.length})
								</h3>
								{members.length === 0 ? (
									<p className="px-4 py-3 text-sm text-muted-foreground">No members yet.</p>
								) : (
									<ul className="space-y-1">
										{members.map((p) => (
											<li
												key={p.id}
												className="flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
											>
												<UserAvatar
													firstName={p.firstName}
													lastName={p.lastName}
													avatar={p.avatar}
													image={p.image}
													size="lg"
													className="border border-gray-100 bg-background text-primary dark:border-white/10"
												/>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-foreground">
														{p.firstName} {p.lastName}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{p.position ?? "—"}
													</p>
												</div>
												<button
													type="button"
													onClick={() => move(p.id, null)}
													disabled={pendingId !== null}
													aria-label={`Remove ${p.firstName} ${p.lastName}`}
													className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-[oklch(0.96_0.03_18)] hover:text-primary disabled:opacity-50 dark:hover:bg-primary/10"
												>
													{pendingId === p.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<X className="h-4 w-4" />
													)}
												</button>
											</li>
										))}
									</ul>
								)}
							</section>

							<section>
								<h3 className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									Add member
								</h3>
								<div className="px-4 pb-2">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<input
											type="text"
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											placeholder="Search your department…"
											className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/30 dark:border-white/10 dark:bg-white/5"
										/>
									</div>
								</div>
								{filteredAssignable.length === 0 ? (
									<p className="px-4 py-3 text-sm text-muted-foreground">
										{assignable.length === 0
											? "No eligible members to add."
											: "No matching members."}
									</p>
								) : (
									<ul className="space-y-1">
										{filteredAssignable.map((p) => (
											<li
												key={p.id}
												className="flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
											>
												<UserAvatar
													firstName={p.firstName}
													lastName={p.lastName}
													avatar={p.avatar}
													image={p.image}
													size="lg"
													className="border border-gray-100 bg-background text-primary dark:border-white/10"
												/>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-foreground">
														{p.firstName} {p.lastName}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{p.subDepartmentId
															? "Another of your teams"
															: (p.position ?? "Unassigned")}
													</p>
												</div>
												<button
													type="button"
													onClick={() => move(p.id, subDepartmentId)}
													disabled={pendingId !== null}
													aria-label={`Add ${p.firstName} ${p.lastName}`}
													className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
												>
													{pendingId === p.id ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													) : (
														<Plus className="h-3.5 w-3.5" />
													)}
													Add
												</button>
											</li>
										))}
									</ul>
								)}
							</section>
						</div>
					)}

					<div className="flex justify-end rounded-b-[2rem] border-t border-gray-200/60 bg-gray-50/50 px-8 py-5 dark:border-white/10 dark:bg-white/[0.02]">
						<button
							type="button"
							onClick={() => handleOpenChange(false)}
							className="inline-flex justify-center rounded-full border border-gray-200 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-white/10 dark:hover:bg-white/5 dark:focus:ring-white/10"
						>
							Done
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
