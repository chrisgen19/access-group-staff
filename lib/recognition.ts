export interface RecognitionUser {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	position: string | null;
}

export interface RecognitionCard {
	id: string;
	message: string;
	date: string;
	createdAt: string;
	sender: RecognitionUser;
	recipient: RecognitionUser;
	valuesPeople: boolean;
	valuesSafety: boolean;
	valuesRespect: boolean;
	valuesCommunication: boolean;
	valuesContinuousImprovement: boolean;
}

export const COMPANY_VALUES = [
	{ key: "valuesPeople" as const, label: "People", wrap: false },
	{ key: "valuesSafety" as const, label: "Safety", wrap: false },
	{ key: "valuesRespect" as const, label: "Respect", wrap: false },
	{ key: "valuesCommunication" as const, label: "Communication", wrap: false },
	{
		key: "valuesContinuousImprovement" as const,
		label: "Continuous Improvement",
		wrap: true,
	},
] as const;

export const VALUE_LABELS: Record<string, string> = {
	valuesPeople: "People",
	valuesSafety: "Safety",
	valuesRespect: "Respect",
	valuesCommunication: "Communication",
	valuesContinuousImprovement: "Continuous Improvement",
};

export function formatRecognitionDate(dateString: string) {
	const [year, month, day] = dateString.split("T")[0].split("-");
	return new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
	).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function getSelectedValues(card: RecognitionCard): string[] {
	return Object.entries(VALUE_LABELS)
		.filter(([key]) => card[key as keyof RecognitionCard] === true)
		.map(([, label]) => label);
}
