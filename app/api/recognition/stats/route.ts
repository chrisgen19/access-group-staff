import type { Role } from "@/app/generated/prisma/client";
import {
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { formatMonthLabel, getArchivedRecipients } from "@/lib/leaderboard/history";
import { getCurrentMonthBoundaries } from "@/lib/leaderboard/month";
import { maybeSnapshotPreviousMonth } from "@/lib/leaderboard/snapshot";
import { computeLeaderboardVisibility } from "@/lib/leaderboard/visibility";
import { hasMinRole } from "@/lib/permissions";

// Super-admin only: lets them preview a future/past date
// (e.g. ?previewNow=2026-06-01) to see the reveal window without waiting for
// the real calendar. The param is ignored for everyone else.
function resolveNow(request: Request, allowPreview: boolean): Date {
	if (!allowPreview) return new Date();
	const preview = new URL(request.url).searchParams.get("previewNow");
	if (!preview) return new Date();
	const parsed = new Date(preview);
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET(request: Request) {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	try {
		const userId = session.user.id;
		const isSuperAdmin = hasMinRole(session.user.role as Role, "SUPERADMIN");
		const now = resolveNow(request, isSuperAdmin);
		const { start: startOfMonth, end: endOfMonth } = getCurrentMonthBoundaries(now);

		await maybeSnapshotPreviousMonth(now).catch(() => {
			// Snapshot failures must not break the stats response.
		});

		const [visibilitySettings, topLimit] = await Promise.all([
			getLeaderboardVisibilitySettings(),
			getTopRecognizedLimit(),
		]);
		const visibility = computeLeaderboardVisibility(visibilitySettings, now);

		const [sent, received, monthlyTotal] = await Promise.all([
			prisma.recognitionCard.count({
				where: {
					senderId: userId,
					externalSenderName: null,
					createdAt: { gte: startOfMonth, lt: endOfMonth },
				},
			}),
			prisma.recognitionCard.count({
				where: {
					recipientId: userId,
					createdAt: { gte: startOfMonth, lt: endOfMonth },
				},
			}),
			prisma.recognitionCard.count({
				where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
			}),
		]);

		let topRecipients: Array<{
			firstName: string;
			lastName: string;
			avatar: string | null;
			count: number;
		}> = [];

		// During the reveal window we show the previous (completed) month's
		// finalized winners, read from its archived snapshot — never a live tally.
		if (visibility.visible) {
			const recipients = await getArchivedRecipients(visibility.sourceMonthKey, topLimit);
			topRecipients = (recipients ?? []).map((r) => ({
				firstName: r.firstName,
				lastName: r.lastName,
				avatar: r.avatar,
				count: r.count,
			}));
		}

		return Response.json({
			success: true,
			data: {
				sent,
				received,
				monthlyTotal,
				topRecipients,
				leaderboardVisibility: {
					visible: visibility.visible,
					sourceMonthKey: visibility.sourceMonthKey,
					sourceMonthLabel: formatMonthLabel(visibility.sourceMonthKey),
					revealStart: visibility.revealStart.toISOString(),
					revealEnd: visibility.revealEnd.toISOString(),
					nextRevealStart: visibility.nextRevealStart.toISOString(),
				},
			},
		});
	} catch {
		return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
