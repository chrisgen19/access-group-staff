export function sanitizeCallback(callbackUrl: string | null | undefined): string | null {
	if (!callbackUrl) return null;
	if (!callbackUrl.startsWith("/")) return null;
	if (callbackUrl.startsWith("//") || callbackUrl.startsWith("/\\")) return null;
	return callbackUrl;
}

export function safeCallbackOrDefault(
	callbackUrl: string | null | undefined,
	fallback = "/dashboard",
): string {
	return sanitizeCallback(callbackUrl) ?? fallback;
}
