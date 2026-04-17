export const REACTION_EMOJIS = ["👏", "❤️", "🔥", "🎉", "💪", "😊"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface CardReactionUser {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
}

export interface CardReactionSummary {
	emoji: string;
	count: number;
	hasReacted: boolean;
	users?: CardReactionUser[];
}

export interface CardCommentUser {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	position: string | null;
}

export interface CardComment {
	id: string;
	body: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	user: CardCommentUser;
}

export interface CardInteractions {
	reactions: CardReactionSummary[];
	comments: CardComment[];
	totalComments: number;
}

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
	interactionCounts: { reactions: number; comments: number } | null;
	reactionSummary?: { emoji: string; count: number; hasReacted: boolean }[];
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

export const VALUE_KEY_MAP: Record<string, string> = {
	people: "valuesPeople",
	safety: "valuesSafety",
	respect: "valuesRespect",
	communication: "valuesCommunication",
	continuousImprovement: "valuesContinuousImprovement",
};

export function formatRecognitionDate(dateString: string) {
	const [year, month, day] = dateString.split("T")[0].split("-");
	return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-US", {
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

export interface ExportRecognitionUser {
	id: string;
	firstName: string;
	lastName: string;
	position: string | null;
	branch: string | null;
	department: { name: string } | null;
}

export interface ExportRecognitionCard {
	id: string;
	message: string;
	date: string;
	sender: ExportRecognitionUser;
	recipient: ExportRecognitionUser;
	valuesPeople: boolean;
	valuesSafety: boolean;
	valuesRespect: boolean;
	valuesCommunication: boolean;
	valuesContinuousImprovement: boolean;
}

function formatDateForExport(dateString: string): string {
	const [year, month, day] = dateString.split("T")[0].split("-");
	const d = new Date(Number(year), Number(month) - 1, Number(day));
	const dayNum = d.getDate();
	const mon = d.toLocaleDateString("en-US", { month: "short" });
	const yr = String(d.getFullYear()).slice(2);
	return `${dayNum}-${mon}-${yr}`;
}

function getQuarter(dateString: string): string {
	const month = Number(dateString.split("T")[0].split("-")[1]);
	if (month <= 3) return "Q1";
	if (month <= 6) return "Q2";
	if (month <= 9) return "Q3";
	return "Q4";
}

function escapeCsvField(value: string): string {
	const needsQuoting = value.includes(",") || value.includes('"') || value.includes("\n");
	const escaped = needsQuoting ? `"${value.replace(/"/g, '""')}"` : value;
	if (/^[=+\-@\t\r]/.test(escaped)) {
		return `\t${escaped}`;
	}
	return escaped;
}

const CSV_HEADERS = [
	"Department",
	"Team Member",
	"Role",
	"Date Received",
	"Receivers Branch",
	"Givers Branch",
	"Given By",
	"Brief of what team member did",
	"Safety",
	"People",
	"Respect",
	"Communication",
	"Continuous Improvement",
	"Quarter Received",
];

export function generateRecognitionCsv(cards: ExportRecognitionCard[]): string {
	const rows = cards.map((card) => [
		card.recipient.department?.name ?? "",
		`${card.recipient.firstName} ${card.recipient.lastName}`,
		card.recipient.position ?? "",
		formatDateForExport(card.date),
		card.recipient.branch ?? "",
		card.sender.branch ?? "",
		`${card.sender.firstName} ${card.sender.lastName}`,
		card.message,
		card.valuesSafety ? "x" : "",
		card.valuesPeople ? "x" : "",
		card.valuesRespect ? "x" : "",
		card.valuesCommunication ? "x" : "",
		card.valuesContinuousImprovement ? "x" : "",
		getQuarter(card.date),
	]);

	const lines = [CSV_HEADERS.join(","), ...rows.map((row) => row.map(escapeCsvField).join(","))];

	return lines.join("\n");
}
