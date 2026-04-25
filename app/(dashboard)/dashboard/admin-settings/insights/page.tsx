import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { requireRoleOrRedirect } from "@/lib/auth-utils";
import {
	getCardCadence,
	getCategoryMix,
	getTopRecognisers,
	getTopValues,
} from "@/lib/insights/queries";
import { CadenceCard } from "./_components/cadence-card";
import { CategoryMixCard } from "./_components/category-mix-card";
import { TopRecognisersCard } from "./_components/top-recognisers-card";
import { TopValuesCard } from "./_components/top-values-card";

const DAYS_BACK = 30;
const TOP_RECOGNISERS_LIMIT = 10;

export default async function InsightsPage() {
	await requireRoleOrRedirect("ADMIN");

	const [cadence, topValues, topRecognisers, categoryMix] = await Promise.all([
		getCardCadence(DAYS_BACK),
		getTopValues(DAYS_BACK),
		getTopRecognisers(DAYS_BACK, TOP_RECOGNISERS_LIMIT),
		getCategoryMix(DAYS_BACK),
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
				<TopRecognisersCard data={topRecognisers} daysBack={DAYS_BACK} />
				<CategoryMixCard data={categoryMix} daysBack={DAYS_BACK} />
			</div>
		</div>
	);
}
