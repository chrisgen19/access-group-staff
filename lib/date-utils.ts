export function formatLocalDate(date: Date): string {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

export function isValidIsoDate(val: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
	const y = Number(val.slice(0, 4));
	const m = Number(val.slice(5, 7));
	const d = Number(val.slice(8, 10));
	const parsed = new Date(Date.UTC(y, m - 1, d));
	return (
		parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d
	);
}

export function isNotFutureIsoDate(val: string): boolean {
	const now = new Date();
	now.setUTCDate(now.getUTCDate() + 1);
	const maxAllowed = now.toISOString().slice(0, 10);
	return val <= maxAllowed;
}
