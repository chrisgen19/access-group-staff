export interface ExportUser {
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	position: string | null;
	branch: string | null;
	createdAt: Date | string;
	deletedAt: Date | string | null;
	department: { name: string } | null;
}

function escapeCsvField(value: string): string {
	const safeValue = /^[=+\-@\t\r]/.test(value) ? `\t${value}` : value;
	const needsQuoting =
		safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n");
	return needsQuoting ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
}

const CSV_HEADERS = [
	"First Name",
	"Last Name",
	"Email",
	"Role",
	"Department",
	"Branch",
	"Joined",
	"Position",
	"Status",
];

function formatCsvDate(value: Date | string): string {
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return "";
	return new Intl.DateTimeFormat("en-AU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(parsed);
}

export function generateUserCsv(users: ExportUser[]): string {
	const rows = users.map((user) => [
		user.firstName,
		user.lastName,
		user.email,
		user.role,
		user.department?.name ?? "",
		user.branch ?? "",
		formatCsvDate(user.createdAt),
		user.position ?? "",
		user.deletedAt ? "Deleted" : "Active",
	]);

	const lines = [CSV_HEADERS.join(","), ...rows.map((row) => row.map(escapeCsvField).join(","))];

	return lines.join("\n");
}
