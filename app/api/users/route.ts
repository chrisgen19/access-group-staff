import type { NextRequest } from "next/server";
import type { Branch, Prisma, Role } from "@/app/generated/prisma/client";
import { AuthError, requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { canViewUsers } from "@/lib/permissions";

const VALID_ROLES: Role[] = ["STAFF", "ADMIN", "SUPERADMIN"];
const VALID_BRANCHES: Branch[] = ["ISO", "PERTH"];
const EXPORT_LIMIT = 10_000;
const SEARCH_MAX_LENGTH = 200;

function parseRoles(param: string | null): Role[] {
	if (!param) return [];
	return param
		.split(",")
		.map((r) => r.trim().toUpperCase())
		.filter((r): r is Role => VALID_ROLES.includes(r as Role));
}

function parseBranch(param: string | null): Branch | null {
	if (!param) return null;
	const upper = param.toUpperCase();
	return VALID_BRANCHES.includes(upper as Branch) ? (upper as Branch) : null;
}

export async function GET(request: NextRequest) {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch (error) {
		if (error instanceof AuthError) {
			return Response.json({ success: false, error: error.message }, { status: error.status });
		}
		return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
	}

	if (!canViewUsers(session.user.role as Role)) {
		return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = request.nextUrl;
	const paginated = searchParams.get("paginated") === "true";
	const isExport = searchParams.get("export") === "true";

	const includeDeleted = searchParams.get("includeDeleted") === "true";
	const onlyDeleted = searchParams.get("onlyDeleted") === "true";

	const deletedFilter: Prisma.UserWhereInput | null = onlyDeleted
		? { deletedAt: { not: null } }
		: includeDeleted
			? null
			: { deletedAt: null };

	if (!paginated && !isExport) {
		const users = await prisma.user.findMany({
			where: deletedFilter ?? undefined,
			include: { department: true },
			orderBy: { createdAt: "desc" },
		});
		return Response.json({ success: true, data: users });
	}

	const search = searchParams.get("search")?.trim().slice(0, SEARCH_MAX_LENGTH);
	const userRole = session.user.role as Role;
	const roles = userRole === "SUPERADMIN" ? parseRoles(searchParams.get("roles")) : [];
	const departmentId = searchParams.get("departmentId")?.trim();
	const branch = parseBranch(searchParams.get("branch"));

	const conditions: Prisma.UserWhereInput[] = [];

	if (deletedFilter) {
		conditions.push(deletedFilter);
	}

	if (search) {
		const tokens = search.split(/\s+/).filter(Boolean);
		for (const token of tokens) {
			conditions.push({
				OR: [
					{ firstName: { contains: token, mode: "insensitive" } },
					{ lastName: { contains: token, mode: "insensitive" } },
					{ email: { contains: token, mode: "insensitive" } },
					{ position: { contains: token, mode: "insensitive" } },
					{ department: { name: { contains: token, mode: "insensitive" } } },
				],
			});
		}
	}

	if (roles.length > 0) {
		conditions.push({ role: { in: roles } });
	}

	if (departmentId) {
		conditions.push({ departmentId });
	}

	if (branch) {
		conditions.push({ branch });
	}

	const where: Prisma.UserWhereInput = conditions.length > 0 ? { AND: conditions } : {};

	if (isExport) {
		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				include: { department: { select: { name: true } } },
				orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { id: "asc" }],
				take: EXPORT_LIMIT,
			}),
			prisma.user.count({ where }),
		]);
		return Response.json({
			success: true,
			data: users,
			total,
			truncated: total > users.length,
			limit: EXPORT_LIMIT,
		});
	}

	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			include: { department: true },
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { id: "asc" }],
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
