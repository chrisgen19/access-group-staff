const DEFAULT_CALLBACK = "/dashboard";

export function sanitizeCallbackUrl(callbackUrl: string | null | undefined): string | null {
	if (!callbackUrl) return null;
	if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return null;
	return callbackUrl;
}

export function safeCallbackUrl(callbackUrl: string | null | undefined): string {
	return sanitizeCallbackUrl(callbackUrl) ?? DEFAULT_CALLBACK;
}
