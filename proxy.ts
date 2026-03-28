import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookies } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const { sessionToken } = getCookies(auth.options);

export async function proxy(request: NextRequest) {
	const sessionCookie = request.cookies.get(sessionToken.name)?.value ?? null;
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/dashboard") && !sessionCookie) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (pathname.startsWith("/dashboard") && sessionCookie) {
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
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/login", "/register"],
};
