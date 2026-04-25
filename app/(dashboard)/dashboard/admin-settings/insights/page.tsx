import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { requireRoleOrRedirect } from "@/lib/auth-utils";
import { getCardCadence, getTopValues } from "@/lib/insights/queries";
import { CadenceCard } from "./_components/cadence-card";
import { TopValuesCard } from "./_components/top-values-card";

const DAYS_BACK = 30;

export default async function InsightsPage() {
	await requireRoleOrRedirect("ADMIN");

	const [cadence, topValues] = await Promise.all([
		getCardCadence(DAYS_BACK),
		getTopValues(DAYS_BACK),
	]);

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Administration"
				title="Insights"
				description="Aggregate trends across recognition activity. Updated on each visit."
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<CadenceCard data={cadence} daysBack={DAYS_BACK} />
				<TopValuesCard data={topValues} daysBack={DAYS_BACK} />
			</div>
		</div>
	);
}
