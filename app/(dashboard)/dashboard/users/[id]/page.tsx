import { ArrowLeft, Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";
import { DISPLAY_DAY_ORDER, SHIFT_DAY_LABELS_SHORT } from "@/lib/validations/user";

function hhmmToMinutes(value: string): number {
	const [h, m] = value.split(":").map((n) => Number.parseInt(n, 10));
	return h * 60 + m;
}

function formatWeeklyHours(minutes: number): string {
	const hours = minutes / 60;
	return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h / week`;
}

const BRANCH_LABELS: Record<string, string> = {
	ISO: "ISO",
	PERTH: "Perth",
};

function formatBranch(branch: string | null): string | null {
	if (!branch) return null;
	return BRANCH_LABELS[branch] ?? branch;
}

function formatDate(value: Date | null): string | null {
	if (!value) return null;
	return new Intl.DateTimeFormat("en-AU", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(value);
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession();
	if (!session || !canViewUsers(session.user.role as Role)) {
		redirect("/dashboard");
	}

	const { id } = await params;
	const user = await prisma.user.findUnique({
		where: { id },
		include: {
			department: true,
			shiftSchedule: { include: { days: { orderBy: { dayOfWeek: "asc" } } } },
		},
	});

	if (!user) notFound();

	const orderedDays = user.shiftSchedule
		? Array.from({ length: 7 }, (_, dayOfWeek) =>
				user.shiftSchedule?.days.find((d) => d.dayOfWeek === dayOfWeek),
			)
		: null;

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div className="flex items-center gap-4">
				<Link
					href="/dashboard/users"
					aria-label="Back to staff directory"
					className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight truncate">
						{user.firstName} {user.lastName}
					</h1>
					<p className="mt-1 text-base text-muted-foreground truncate">{user.email}</p>
				</div>
				{user.deletedAt === null && (
					<Link
						href={`/dashboard/users/${user.id}/edit`}
						className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
					>
						<Pencil className="h-4 w-4" />
						Edit User
					</Link>
				)}
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
					<div className="px-8 pt-8 pb-2">
						<h2 className="text-[1.25rem] font-medium text-foreground">Personal Info</h2>
					</div>
					<div className="px-8 py-6 space-y-4">
						<InfoRow label="First Name" value={user.firstName} />
						<InfoRow label="Last Name" value={user.lastName} />
						<InfoRow label="Display Name" value={user.displayName} />
						<InfoRow label="Email" value={user.email} />
						<InfoRow label="Phone" value={user.phone} />
						<InfoRow label="Birthday" value={formatDate(user.birthday)} />
					</div>
				</div>

				<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
					<div className="px-8 pt-8 pb-2">
						<h2 className="text-[1.25rem] font-medium text-foreground">Work Info</h2>
					</div>
					<div className="px-8 py-6 space-y-4">
						<InfoRow label="Position" value={user.position} />
						<InfoRow label="Department" value={user.department?.name} />
						<InfoRow label="Branch" value={formatBranch(user.branch)} />
						<div className="flex justify-between items-center py-1">
							<span className="text-sm text-muted-foreground">Role</span>
							<Badge
								variant={
									user.role === "SUPERADMIN"
										? "destructive"
										: user.role === "ADMIN"
											? "default"
											: "secondary"
								}
							>
								{user.role}
							</Badge>
						</div>
						<div className="flex justify-between items-center py-1">
							<span className="text-sm text-muted-foreground">Status</span>
							<Badge variant={user.deletedAt ? "destructive" : "outline"}>
								{user.deletedAt ? "Deleted" : "Active"}
							</Badge>
						</div>
						<InfoRow label="Date Hired" value={formatDate(user.hireDate)} />
						<InfoRow label="Joined" value={user.createdAt.toLocaleDateString()} />
					</div>
				</div>
			</div>

			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
				<div className="px-8 pt-8 pb-4 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<h2 className="text-[1.25rem] font-medium text-foreground leading-tight">
								Shift Schedule
							</h2>
							{user.shiftSchedule && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{user.shiftSchedule.timezone}
								</p>
							)}
						</div>
					</div>
					{orderedDays &&
						(() => {
							const totalMins = orderedDays.reduce((sum, day) => {
								if (!day?.isWorking || !day.startTime || !day.endTime) return sum;
								return (
									sum + (hhmmToMinutes(day.endTime) - hhmmToMinutes(day.startTime)) - day.breakMins
								);
							}, 0);
							const workingCount = orderedDays.filter((d) => d?.isWorking).length;
							return (
								<div className="text-right">
									<div className="text-lg font-semibold text-foreground">
										{formatWeeklyHours(totalMins)}
									</div>
									<div className="text-xs text-muted-foreground">
										{workingCount} working {workingCount === 1 ? "day" : "days"}
									</div>
								</div>
							);
						})()}
				</div>
				<div className="px-8 pb-8">
					{!orderedDays && (
						<div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-6 py-8 text-center">
							<p className="text-sm text-muted-foreground">No shift schedule configured.</p>
						</div>
					)}
					{orderedDays && (
						<div className="grid grid-cols-7 gap-2">
							{DISPLAY_DAY_ORDER.map((dayOfWeek) => {
								const day = orderedDays[dayOfWeek];
								const isWorking = !!(day?.isWorking && day.startTime && day.endTime);
								return (
									<div
										key={dayOfWeek}
										className={`rounded-2xl border px-3 py-3 text-center transition-colors ${
											isWorking
												? "border-primary/20 bg-primary/5"
												: "border-gray-200/60 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02]"
										}`}
									>
										<div
											className={`text-[11px] font-semibold uppercase tracking-wider ${
												isWorking ? "text-primary" : "text-muted-foreground"
											}`}
										>
											{SHIFT_DAY_LABELS_SHORT[dayOfWeek]}
										</div>
										<div
											className={`mt-2 text-sm font-medium ${
												isWorking ? "text-foreground" : "text-muted-foreground/70"
											}`}
										>
											{isWorking ? day?.startTime : "—"}
										</div>
										<div
											className={`text-sm ${
												isWorking ? "text-foreground" : "text-muted-foreground/70"
											}`}
										>
											{isWorking ? day?.endTime : "Off"}
										</div>
										{isWorking && day?.breakMins ? (
											<div className="mt-1 text-[10px] text-muted-foreground">
												{day.breakMins}m break
											</div>
										) : null}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
	return (
		<div className="flex justify-between items-center py-1 gap-4">
			<span className="text-sm text-muted-foreground shrink-0">{label}</span>
			<span
				className="text-sm font-medium text-foreground text-right truncate"
				title={value ?? undefined}
			>
				{value ?? "—"}
			</span>
		</div>
	);
}
