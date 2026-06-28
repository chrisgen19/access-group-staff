import type { Prisma } from "@/app/generated/prisma/client";
import type { ShiftScheduleInput } from "@/lib/validations/user";

/**
 * Replaces a user's shift schedule inside a transaction. `null` clears it.
 * Shared by the admin user form and the team-leader member editor so both
 * persist schedules identically.
 */
export async function upsertShiftSchedule(
	tx: Prisma.TransactionClient,
	userId: string,
	schedule: ShiftScheduleInput | null,
) {
	if (schedule === null) {
		await tx.shiftSchedule.deleteMany({ where: { userId } });
		return;
	}
	const existing = await tx.shiftSchedule.findUnique({ where: { userId } });
	const scheduleId = existing
		? (
				await tx.shiftSchedule.update({
					where: { userId },
					data: { timezone: schedule.timezone },
				})
			).id
		: (
				await tx.shiftSchedule.create({
					data: { userId, timezone: schedule.timezone },
				})
			).id;

	await tx.shiftDay.deleteMany({ where: { scheduleId } });
	await tx.shiftDay.createMany({
		data: schedule.days.map((day) => ({
			scheduleId,
			dayOfWeek: day.dayOfWeek,
			isWorking: day.isWorking,
			startTime: day.isWorking ? (day.startTime ?? null) : null,
			endTime: day.isWorking ? (day.endTime ?? null) : null,
			breakMins: day.isWorking ? day.breakMins : 0,
		})),
	});
}
