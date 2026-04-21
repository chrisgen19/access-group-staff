import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("better-auth/cookies", () => ({
	getCookies: () => ({ sessionToken: { name: "ag.session_token" } }),
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		options: {},
		api: { getSession: vi.fn() },
	},
}));

vi.mock("@/lib/activity-log", () => ({
	extractRequestMeta: vi.fn(() => ({ ipAddress: "1.2.3.4", userAgent: "jest" })),
	logActivity: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		user: { findUnique: vi.fn() },
	},
}));

vi.mock("@/lib/auth/safe-callback", () => ({
	safeCallbackUrl: vi.fn(() => "/dashboard"),
	sanitizeCallbackUrl: vi.fn(() => null),
}));

vi.mock("next/server", async () => {
	const actual = await vi.importActual<typeof import("next/server")>("next/server");
	return {
		...actual,
		after: (fn: () => void | Promise<void>) => {
			void fn();
		},
	};
});

import { NextRequest } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { proxy } from "./proxy";

const USER_ID = "user_abc";
const SESSION_COOKIE = "ag.session_token";
const VISIT_COOKIE = "ag.vl";
const BASE = "https://app.example.test";
const FROZEN_NOW = new Date("2026-04-21T12:34:56.000Z");
const FROZEN_DAY = "2026-04-21";

function buildRequest(path: string, cookies: Record<string, string> = {}) {
	const url = new URL(path, BASE);
	const cookieHeader = Object.entries(cookies)
		.map(([k, v]) => `${k}=${v}`)
		.join("; ");
	return new NextRequest(url, {
		headers: cookieHeader ? { cookie: cookieHeader } : {},
	});
}

function mockAuthedSession() {
	vi.mocked(auth.api.getSession).mockResolvedValue({
		user: { id: USER_ID },
		session: { id: "sess_1" },
	} as never);
	vi.mocked(prisma.user.findUnique).mockResolvedValue({
		deletedAt: null,
	} as never);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
});

describe("proxy() USER_VISITED tracking", () => {
	test("unauthenticated /dashboard request redirects and logs nothing", async () => {
		const response = await proxy(buildRequest("/dashboard"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
		expect(logActivity).not.toHaveBeenCalled();
	});

	test("first authenticated daily visit logs USER_VISITED and sets ag.vl cookie", async () => {
		mockAuthedSession();

		const response = await proxy(buildRequest("/dashboard", { [SESSION_COOKIE]: "opaque" }));

		expect(logActivity).toHaveBeenCalledTimes(1);
		expect(logActivity).toHaveBeenCalledWith(
			expect.objectContaining({ action: "USER_VISITED", actorId: USER_ID }),
		);
		const setCookie = response.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain(`${VISIT_COOKIE}=${USER_ID}%3A${FROZEN_DAY}`);
		expect(setCookie.toLowerCase()).toContain("httponly");
	});

	test("same-day repeat visit with matching ag.vl cookie does not log or re-set cookie", async () => {
		mockAuthedSession();

		const response = await proxy(
			buildRequest("/dashboard/cards", {
				[SESSION_COOKIE]: "opaque",
				[VISIT_COOKIE]: `${USER_ID}:${FROZEN_DAY}`,
			}),
		);

		expect(logActivity).not.toHaveBeenCalled();
		expect(response.headers.get("set-cookie") ?? "").not.toContain(VISIT_COOKIE);
	});

	test("ag.vl cookie from a prior day re-triggers a USER_VISITED log", async () => {
		mockAuthedSession();

		const response = await proxy(
			buildRequest("/dashboard", {
				[SESSION_COOKIE]: "opaque",
				[VISIT_COOKIE]: `${USER_ID}:1999-01-01`,
			}),
		);

		expect(logActivity).toHaveBeenCalledTimes(1);
		expect(logActivity).toHaveBeenCalledWith(
			expect.objectContaining({ action: "USER_VISITED", actorId: USER_ID }),
		);
		expect(response.headers.get("set-cookie") ?? "").toContain(
			`${VISIT_COOKIE}=${USER_ID}%3A${FROZEN_DAY}`,
		);
	});

	test("ag.vl cookie scoped to a different user still logs for the current user", async () => {
		mockAuthedSession();

		const response = await proxy(
			buildRequest("/dashboard", {
				[SESSION_COOKIE]: "opaque",
				[VISIT_COOKIE]: `other_user:${FROZEN_DAY}`,
			}),
		);

		expect(logActivity).toHaveBeenCalledTimes(1);
		expect(logActivity).toHaveBeenCalledWith(
			expect.objectContaining({ action: "USER_VISITED", actorId: USER_ID }),
		);
		expect(response.headers.get("set-cookie") ?? "").toContain(
			`${VISIT_COOKIE}=${USER_ID}%3A${FROZEN_DAY}`,
		);
	});

	test("cookie is flagged Secure in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		mockAuthedSession();

		const response = await proxy(buildRequest("/dashboard", { [SESSION_COOKIE]: "opaque" }));

		const setCookie = response.headers.get("set-cookie") ?? "";
		expect(setCookie.toLowerCase()).toContain("secure");
	});
});
