"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShiftScheduleEditor } from "@/components/shared/shift-schedule-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	getTeamMemberDetailAction,
	updateTeamMemberAction,
} from "@/lib/actions/team-leader-actions";
import {
	DEFAULT_SHIFT_SCHEDULE,
	type ShiftScheduleFieldErrors,
	type ShiftScheduleInput,
	type TeamMemberUpdateInput,
	teamMemberUpdateSchema,
} from "@/lib/validations/user";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

interface ShiftDayLike {
	dayOfWeek: number;
	isWorking: boolean;
	startTime: string | null;
	endTime: string | null;
	breakMins: number;
}

function toScheduleValue(
	schedule: { timezone: string; days: ShiftDayLike[] } | null,
): ShiftScheduleInput | null {
	if (!schedule) return null;
	return {
		timezone: schedule.timezone,
		days: Array.from({ length: 7 }, (_, dayOfWeek) => {
			const existing = schedule.days.find((d) => d.dayOfWeek === dayOfWeek);
			return {
				dayOfWeek,
				isWorking: existing?.isWorking ?? false,
				startTime: existing?.startTime ?? null,
				endTime: existing?.endTime ?? null,
				breakMins: existing?.breakMins ?? 0,
			};
		}),
	};
}

export function TeamMemberDialog({
	memberId,
	memberName,
}: {
	memberId: string;
	memberName: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [contact, setContact] = useState<{ email: string; phone: string | null } | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<TeamMemberUpdateInput>({
		// biome-ignore lint/suspicious/noExplicitAny: zod default()s diverge input/output types; resolver narrows at runtime
		resolver: zodResolver(teamMemberUpdateSchema as any),
		defaultValues: { position: "", shiftSchedule: null },
	});

	const shiftScheduleValue = watch("shiftSchedule");

	async function handleOpen(next: boolean) {
		setOpen(next);
		if (!next) return;
		setIsLoading(true);
		try {
			const result = await getTeamMemberDetailAction(memberId);
			if (!result.success) {
				toast.error(typeof result.error === "string" ? result.error : "Failed to load member");
				setOpen(false);
				return;
			}
			setContact({ email: result.data.email, phone: result.data.phone });
			reset({
				position: result.data.position ?? "",
				shiftSchedule: toScheduleValue(result.data.shiftSchedule),
			});
		} catch {
			toast.error("Something went wrong");
			setOpen(false);
		} finally {
			setIsLoading(false);
		}
	}

	async function onSubmit(data: TeamMemberUpdateInput) {
		setIsSaving(true);
		try {
			const result = await updateTeamMemberAction(memberId, data);
			if (!result.success) {
				const msg = typeof result.error === "string" ? result.error : "Validation failed";
				toast.error(msg);
				return;
			}
			toast.success("Member updated");
			setOpen(false);
			router.refresh();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={() => handleOpen(true)}
				aria-label={`Edit ${memberName}`}
				className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
				title="Edit member"
			>
				<Pencil size={16} />
			</button>

			<Dialog open={open} onOpenChange={handleOpen}>
				<DialogContent
					className="max-w-lg gap-0 rounded-[2rem] p-0 ring-0 border border-gray-100 dark:border-white/5 shadow-2xl"
					showCloseButton={false}
				>
					<DialogHeader className="px-8 pt-8 pb-2">
						<DialogTitle className="text-[1.5rem] leading-tight font-medium tracking-tight">
							{memberName}
						</DialogTitle>
						{contact && (
							<p className="text-sm text-muted-foreground">
								{contact.email}
								{contact.phone ? ` · ${contact.phone}` : ""}
							</p>
						)}
					</DialogHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-16 text-muted-foreground">
							<Loader2 className="h-5 w-5 animate-spin" />
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)}>
							<div className="max-h-[26rem] space-y-5 overflow-y-auto px-8 py-6">
								<div>
									<label
										htmlFor="team-member-position"
										className="mb-1.5 ml-1 block text-sm font-medium text-foreground/70"
									>
										Position
									</label>
									<input
										id="team-member-position"
										className={inputClass}
										placeholder="e.g. BI Developer"
										{...register("position")}
									/>
								</div>

								<div>
									<div className="mb-2 flex items-center justify-between">
										<span className="ml-1 text-sm font-medium text-foreground/70">
											Shift schedule
										</span>
										{shiftScheduleValue ? (
											<button
												type="button"
												onClick={() => setValue("shiftSchedule", null)}
												className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
											>
												Clear
											</button>
										) : (
											<button
												type="button"
												onClick={() => setValue("shiftSchedule", DEFAULT_SHIFT_SCHEDULE)}
												className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
											>
												Add schedule
											</button>
										)}
									</div>
									{shiftScheduleValue ? (
										<ShiftScheduleEditor
											value={shiftScheduleValue}
											onChange={(next: ShiftScheduleInput) => setValue("shiftSchedule", next)}
											errors={errors.shiftSchedule as ShiftScheduleFieldErrors | undefined}
										/>
									) : (
										<div className="rounded-2xl border border-dashed border-gray-200 px-6 py-6 text-center dark:border-white/10">
											<p className="text-sm text-muted-foreground">No shift schedule configured.</p>
										</div>
									)}
								</div>
							</div>

							<div className="flex flex-col-reverse gap-2 rounded-b-[2rem] border-t border-gray-200/60 bg-gray-50/50 px-8 py-6 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:justify-end">
								<button
									type="button"
									onClick={() => setOpen(false)}
									className="inline-flex w-full justify-center rounded-full border border-gray-200 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-white/10 dark:hover:bg-white/5 dark:focus:ring-white/10 sm:w-auto"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSaving}
									className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 sm:w-auto"
								>
									{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Save Changes
								</button>
							</div>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
