import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { Branch, Prisma, Role } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";

const VALID_ROLES: Role[] = ["STAFF", "ADMIN", "SUPERADMIN"];
const VALID_BRANCHES: Branch[] = ["ISO", "PERTH"];
const VALID_STATUSES = ["active", "inactive"] as const;
const EXPORT_LIMIT = 10_000;

function parseRoles(param: string | null): Role[] {
	if (!param) return [];
	return param
		.split(",")
		.map((r) => r.trim().toUpperCase())
		.filter((r): r is Role => VALID_ROLES.includes(r as Role));
}

function parseStatuses(param: string | null): (typeof VALID_STATUSES)[number][] {
	if (!param) return [];
	return param
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter((s): s is (typeof VALID_STATUSES)[number] =>
			VALID_STATUSES.includes(s as (typeof VALID_STATUSES)[number]),
		);
}

function parseBranch(param: string | null): Branch | null {
	if (!param) return null;
	const upper = param.toUpperCase();
	return VALID_BRANCHES.includes(upper as Branch) ? (upper as Branch) : null;
}

export async function GET(request: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session || !canViewUsers(session.user.role as Role)) {
		return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = request.nextUrl;
	const paginated = searchParams.get("paginated") === "true";
	const isExport = searchParams.get("export") === "true";

	if (!paginated && !isExport) {
		const users = await prisma.user.findMany({
			include: { department: true },
			orderBy: { createdAt: "desc" },
		});
		return Response.json({ success: true, data: users });
	}

	const search = searchParams.get("search")?.trim();
	const roles = parseRoles(searchParams.get("roles"));
	const statuses = parseStatuses(searchParams.get("statuses"));
	const departmentId = searchParams.get("departmentId")?.trim();
	const branch = parseBranch(searchParams.get("branch"));

	const conditions: Prisma.UserWhereInput[] = [];

	if (search) {
		conditions.push({
			OR: [
				{ firstName: { contains: search, mode: "insensitive" } },
				{ lastName: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ position: { contains: search, mode: "insensitive" } },
				{ department: { name: { contains: search, mode: "insensitive" } } },
			],
		});
	}

	if (roles.length > 0) {
		conditions.push({ role: { in: roles } });
	}

	if (statuses.length === 1) {
		conditions.push({ isActive: statuses[0] === "active" });
	}

	if (departmentId) {
		conditions.push({ departmentId });
	}

	if (branch) {
		conditions.push({ branch });
	}

	const where: Prisma.UserWhereInput = conditions.length > 0 ? { AND: conditions } : {};

	if (isExport) {
		const users = await prisma.user.findMany({
			where,
			include: { department: { select: { name: true } } },
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
			take: EXPORT_LIMIT,
		});
		return Response.json({ success: true, data: users });
	}

	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			include: { department: true },
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.user.count({ where }),
	]);

	return Response.json({
		success: true,
		data: users,
		pagination: {
			page,
			pageSize,
			total,
			totalPages: Math.ceil(total / pageSize),
		},
	});
}
