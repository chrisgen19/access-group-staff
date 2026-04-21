import { getCookies } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { extractRequestMeta, logActivity } from "@/lib/activity-log";
import { auth } from "@/lib/auth";
import { safeCallbackUrl, sanitizeCallbackUrl } from "@/lib/auth/safe-callback";
import { prisma } from "@/lib/db";

const { sessionToken } = getCookies(auth.options);

const VISIT_COOKIE = "ag.vl";

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
		if (pathname !== "/dashboard") {
			loginUrl.searchParams.set("callbackUrl", pathname);
		}
		return NextResponse.redirect(loginUrl);
	}

	const todayUtc = new Date().toISOString().slice(0, 10);
	let pendingVisitActorId: string | null = null;

	if (isProtected && sessionCookie) {
		const session = await resolveSession(request);
		if (!session) {
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.delete(sessionToken.name);
			return response;
		}
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { deletedAt: true },
		});
		if (!user || user.deletedAt !== null) {
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.delete(sessionToken.name);
			return response;
		}

		if (request.cookies.get(VISIT_COOKIE)?.value !== `${session.user.id}:${todayUtc}`) {
			pendingVisitActorId = session.user.id;
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

	const response = NextResponse.next();

	if (pendingVisitActorId) {
		const { ipAddress, userAgent } = extractRequestMeta(request.headers);
		const actorId = pendingVisitActorId;
		void logActivity({
			action: "USER_VISITED",
			actorId,
			ipAddress,
			userAgent,
		});
		response.cookies.set(VISIT_COOKIE, `${actorId}:${todayUtc}`, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 86400,
		});
	}

	return response;
}

export const config = {
	matcher: ["/dashboard/:path*", "/login", "/register"],
};
