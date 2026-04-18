import { getCookies } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeCallbackUrl, sanitizeCallbackUrl } from "@/lib/auth/safe-callback";
import { prisma } from "@/lib/db";

const { sessionToken } = getCookies(auth.options);

async function resolveSession(request: NextRequest) {
	try {
		return await auth.api.getSession({ headers: request.headers });
	} catch {
		return null;
	}
}

export async function proxy(request: NextRequest) {
	const sessionCookie = request.cookies.get(sessionToken.name)?.value ?? null;
	const { pathname } = request.nextUrl;

	const isProtected = pathname.startsWith("/dashboard");

	if (isProtected && !sessionCookie) {
		const loginUrl = new URL("/login", request.url);
		if (!pathname.startsWith("/dashboard")) {
			loginUrl.searchParams.set("callbackUrl", pathname);
		}
		return NextResponse.redirect(loginUrl);
	}

	if (isProtected && sessionCookie) {
		const session = await resolveSession(request);
		if (!session) {
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.delete(sessionToken.name);
			return response;
		}
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { isActive: true },
		});
		if (!user?.isActive) {
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.delete(sessionToken.name);
			return response;
		}
	}

	if ((pathname === "/login" || pathname === "/register") && sessionCookie) {
		const session = await resolveSession(request);
		if (!session) {
			const authUrl = new URL(pathname, request.url);
			const safeCallback = sanitizeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
			if (safeCallback) {
				authUrl.searchParams.set("callbackUrl", safeCallback);
			}
			const response = NextResponse.redirect(authUrl);
			response.cookies.delete(sessionToken.name);
			return response;
		}
		const safeCallback = safeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
		return NextResponse.redirect(new URL(safeCallback, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/login", "/register"],
};
