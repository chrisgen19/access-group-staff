import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookies } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const { sessionToken } = getCookies(auth.options);

export async function proxy(request: NextRequest) {
	const sessionCookie = request.cookies.get(sessionToken.name)?.value ?? null;
	const { pathname } = request.nextUrl;

	const isProtected =
		pathname.startsWith("/dashboard") ||
		(pathname.startsWith("/recognition/") && !pathname.endsWith("/opengraph-image"));

	if (isProtected && !sessionCookie) {
		const loginUrl = new URL("/login", request.url);
		if (!pathname.startsWith("/dashboard")) {
			loginUrl.searchParams.set("callbackUrl", pathname);
		}
		return NextResponse.redirect(loginUrl);
	}

	if (isProtected && sessionCookie) {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (session) {
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
	}

	if ((pathname === "/login" || pathname === "/register") && sessionCookie) {
		const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
		const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";
		return NextResponse.redirect(new URL(safeCallback, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/login", "/register", "/recognition/:path*"],
};
