import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CadenceCard } from "@/components/insights/cadence-card";
import { TopRecognisersCard } from "@/components/insights/top-recognisers-card";
import { TopValuesCard } from "@/components/insights/top-values-card";
import { WindowSelector } from "@/components/insights/window-selector";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getCardCadence, getTopRecognisers, getTopValues } from "@/lib/insights/queries";

const ALLOWED_WINDOWS = [30, 90] as const;
type AllowedWindow = (typeof ALLOWED_WINDOWS)[number];
const DEFAULT_WINDOW: AllowedWindow = 30;
const TOP_RECOGNISERS_LIMIT = 10;

function parseWindow(raw: string | string[] | undefined): AllowedWindow {
	const value = Array.isArray(raw) ? raw[0] : raw;
	const n = value === undefined || value === "" ? Number.NaN : Number(value);
	return (ALLOWED_WINDOWS as readonly number[]).includes(n) ? (n as AllowedWindow) : DEFAULT_WINDOW;
}

export default async function TeamInsightsPage({
	searchParams,
}: {
	searchParams: Promise<{ window?: string | string[] }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const ledSubDepartments = await prisma.subDepartment.findMany({
		where: { teamLeaderId: session.user.id },
		select: { id: true },
	});
	// Only team leaders can see team insights; everyone else goes back to My Team.
	if (ledSubDepartments.length === 0) {
		redirect("/dashboard/my-team");
	}

	const ledIds = ledSubDepartments.map((s) => s.id);
	const members = await prisma.user.findMany({
		where: { subDepartmentId: { in: ledIds }, deletedAt: null },
		select: { id: true },
	});
	const memberIds = members.map((m) => m.id);

	const params = await searchParams;
	const daysBack = parseWindow(params.window);
	const scope = { memberIds };

	const [cadence, topValues, topRecognisers] = await Promise.all([
		getCardCadence(daysBack, scope),
		getTopValues(daysBack, scope),
		getTopRecognisers(daysBack, TOP_RECOGNISERS_LIMIT, scope),
	]);

	return (
		<div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
			<Link
				href="/dashboard/my-team"
				aria-label="Back to My Team"
				className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-200/50 hover:text-foreground dark:hover:bg-white/5"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to My Team
			</Link>
			<DashboardPageHeader
				eyebrow="My Team"
				title="Team Insights"
				description="Recognition trends for the members of the team(s) you lead. Updated on each visit."
			/>

			<div className="flex justify-end">
				<WindowSelector value={daysBack} />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<CadenceCard data={cadence} daysBack={daysBack} />
				<TopValuesCard data={topValues} daysBack={daysBack} />
				<TopRecognisersCard data={topRecognisers} daysBack={daysBack} />
			</div>
		</div>
	);
}
