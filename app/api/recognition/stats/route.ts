import type { Role } from "@/app/generated/prisma/client";
import {
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { formatMonthLabel, getArchivedRecipients } from "@/lib/leaderboard/history";
import { getCurrentMonthBoundaries, manilaDateStringToUtc } from "@/lib/leaderboard/month";
import { computeMonthRecipients, maybeSnapshotPreviousMonth } from "@/lib/leaderboard/snapshot";
import { computeLeaderboardVisibility } from "@/lib/leaderboard/visibility";
import { hasMinRole } from "@/lib/permissions";

// Super-admin only: lets them preview a future/past date
// (e.g. ?previewNow=2026-06-01) to see the reveal window without waiting for
// the real calendar. Returns null (real clock) for everyone else. The date is
// interpreted as Asia/Manila midnight so it lines up with the visibility math.
function resolvePreviewNow(request: Request, allowPreview: boolean): Date | null {
	if (!allowPreview) return null;
	const preview = new URL(request.url).searchParams.get("previewNow");
	if (!preview) return null;
	const manila = manilaDateStringToUtc(preview);
	if (manila) return manila;
	// Accept full timestamps too, but never an invalid date.
	const parsed = new Date(preview);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
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
		const realNow = new Date();
		const previewNow = resolvePreviewNow(request, isSuperAdmin);
		const now = previewNow ?? realNow;
		const { start: startOfMonth, end: endOfMonth } = getCurrentMonthBoundaries(now);

		// Always snapshot against the real clock. Archiving with a simulated
		// preview date would freeze a partial month — the unique-month upsert's
		// empty update never corrects it, permanently corrupting the winners.
		await maybeSnapshotPreviousMonth(realNow).catch((err) => {
			// A snapshot failure must not break the stats response, but it must
			// not be silent either — the live fallback below covers the read.
			console.error("maybeSnapshotPreviousMonth failed", { error: err });
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
			let recipients = await getArchivedRecipients(visibility.sourceMonthKey, topLimit);
			// Fall back to a live computation when the archive is missing or invalid
			// (snapshot not yet written, swallowed failure, or corrupt JSON), so the
			// reveal window never shows a false "no winners" state. Safe for everyone:
			// the source month is closed, so counts are stable, and this never writes.
			if (!recipients) {
				recipients = await computeMonthRecipients(visibility.sourceMonthKey, topLimit);
			}
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
