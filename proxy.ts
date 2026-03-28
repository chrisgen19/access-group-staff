import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { prisma } from "@/lib/db";

export async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/dashboard") && !sessionCookie) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (pathname.startsWith("/dashboard") && sessionCookie) {
		const session = await prisma.session.findUnique({
			where: { token: sessionCookie },
			select: { userId: true },
		});
		if (session) {
			const user = await prisma.user.findUnique({
				where: { id: session.userId },
				select: { isActive: true },
			});
			if (!user?.isActive) {
				const response = NextResponse.redirect(new URL("/login", request.url));
				response.cookies.delete("better-auth.session_token");
				return response;
			}
		}
	}

	if ((pathname === "/login" || pathname === "/register") && sessionCookie) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/login", "/register"],
};
