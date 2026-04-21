import { prisma } from "../lib/db";

const CANONICAL_DEPARTMENTS = [
	{ name: "COE", code: "COE" },
	{ name: "Credit Management", code: "CM" },
	{ name: "Finance", code: "FIN" },
	{ name: "Fleet", code: "FLT" },
	{ name: "Human Resources", code: "HR" },
	{ name: "IT", code: "IT" },
	{ name: "IT Support", code: "ITS" },
	{ name: "Lead Generation", code: "LG" },
	{ name: "Marketing", code: "MKT" },
	{ name: "Operations", code: "OPS" },
	{ name: "Training", code: "TRN" },
] as const;

const REUSE_MAPPINGS = [
	{ fromCode: "ENG", to: { name: "COE", code: "COE" } },
	{ fromCode: "SAF", to: { name: "Training", code: "TRN" } },
] as const;

async function reconcileDepartments() {
	await prisma.$transaction(async (tx) => {
		for (const mapping of REUSE_MAPPINGS) {
			const existing = await tx.department.findUnique({
				where: { code: mapping.fromCode },
			});
			if (!existing) continue;

			const target = await tx.department.findUnique({
				where: { code: mapping.to.code },
			});
			if (target) {
				await tx.user.updateMany({
					where: { departmentId: existing.id },
					data: { departmentId: target.id },
				});

				await tx.department.delete({
					where: { id: existing.id },
				});
				continue;
			}

			await tx.department.update({
				where: { id: existing.id },
				data: mapping.to,
			});
		}

		for (const department of CANONICAL_DEPARTMENTS) {
			await tx.department.upsert({
				where: { code: department.code },
				update: { name: department.name },
				create: department,
			});
		}

		const obsoleteDepartments = await tx.department.findMany({
			where: {
				code: {
					notIn: CANONICAL_DEPARTMENTS.map((department) => department.code),
				},
			},
			include: {
				_count: {
					select: { users: true },
				},
			},
			orderBy: { name: "asc" },
		});

		const blockedDepartments = obsoleteDepartments.filter(
			(department) => department._count.users > 0,
		);
		if (blockedDepartments.length > 0) {
			throw new Error(
				[
					"Cannot remove obsolete departments with assigned users.",
					...blockedDepartments.map(
						(department) =>
							`- ${department.name} (${department.code}): ${department._count.users} users`,
					),
				].join("\n"),
			);
		}

		if (obsoleteDepartments.length > 0) {
			await tx.department.deleteMany({
				where: { id: { in: obsoleteDepartments.map((department) => department.id) } },
			});
		}
	});

	const finalDepartments = await prisma.department.findMany({
		include: { _count: { select: { users: true } } },
		orderBy: { name: "asc" },
	});

	console.log(
		JSON.stringify(
			finalDepartments.map(({ name, code, _count }) => ({
				name,
				code,
				users: _count.users,
			})),
			null,
			2,
		),
	);
}

reconcileDepartments()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
