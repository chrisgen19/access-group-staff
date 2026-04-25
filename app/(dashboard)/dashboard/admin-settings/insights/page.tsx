import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { requireRoleOrRedirect } from "@/lib/auth-utils";
import {
	getCardCadence,
	getCategoryMix,
	getMostEngagedCards,
	getTopRecognisers,
	getTopValues,
} from "@/lib/insights/queries";
import { CadenceCard } from "./_components/cadence-card";
import { CategoryMixCard } from "./_components/category-mix-card";
import { EngagedCardsCard } from "./_components/engaged-cards-card";
import { TopRecognisersCard } from "./_components/top-recognisers-card";
import { TopValuesCard } from "./_components/top-values-card";
import { WindowSelector } from "./_components/window-selector";

const ALLOWED_WINDOWS = [30, 90] as const;
type AllowedWindow = (typeof ALLOWED_WINDOWS)[number];
const DEFAULT_WINDOW: AllowedWindow = 30;
const TOP_RECOGNISERS_LIMIT = 10;
const ENGAGED_CARDS_LIMIT = 5;

function parseWindow(raw: string | string[] | undefined): AllowedWindow {
	const value = Array.isArray(raw) ? raw[0] : raw;
	const n = Number.parseInt(value ?? "", 10);
	return (ALLOWED_WINDOWS as readonly number[]).includes(n) ? (n as AllowedWindow) : DEFAULT_WINDOW;
}

export default async function InsightsPage({
	searchParams,
}: {
	searchParams: Promise<{ window?: string | string[] }>;
}) {
	await requireRoleOrRedirect("ADMIN");

	const params = await searchParams;
	const daysBack = parseWindow(params.window);

	const [cadence, topValues, topRecognisers, categoryMix, engagedCards] = await Promise.all([
		getCardCadence(daysBack),
		getTopValues(daysBack),
		getTopRecognisers(daysBack, TOP_RECOGNISERS_LIMIT),
		getCategoryMix(daysBack),
		getMostEngagedCards(daysBack, ENGAGED_CARDS_LIMIT),
	]);

	return (
		<div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
			<DashboardPageHeader
				eyebrow="Administration"
				title="Insights"
				description="Aggregate trends across recognition activity. Updated on each visit."
			/>

			<div className="flex justify-end">
				<WindowSelector value={daysBack} />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<CadenceCard data={cadence} daysBack={daysBack} />
				<TopValuesCard data={topValues} daysBack={daysBack} />
				<TopRecognisersCard data={topRecognisers} daysBack={daysBack} />
				<CategoryMixCard data={categoryMix} daysBack={daysBack} />
				<EngagedCardsCard data={engagedCards} daysBack={daysBack} />
			</div>
		</div>
	);
}
