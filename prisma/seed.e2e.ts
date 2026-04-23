import { E2E_ADMIN, E2E_RECIPIENT, E2E_SENDER } from "../e2e/test-users";
import { auth } from "../lib/auth";
import { prisma } from "../lib/db";

async function upsertUser(
	user: typeof E2E_SENDER,
	departmentId: string,
	role: "STAFF" | "ADMIN" = "STAFF",
) {
	const existing = await prisma.user.findUnique({ where: { email: user.email } });
	if (existing) {
		await prisma.user.update({
			where: { id: existing.id },
			data: { departmentId, deletedAt: null, role, branch: "ISO" },
		});
		return existing.id;
	}

	const result = await auth.api.signUpEmail({
		body: {
			email: user.email,
			password: user.password,
			name: `${user.firstName} ${user.lastName}`,
			firstName: user.firstName,
			lastName: user.lastName,
		},
	});

	if (!result.user) throw new Error(`Failed to create ${user.email}`);

	await prisma.user.update({
		where: { id: result.user.id },
		data: { departmentId, role, branch: "ISO" },
	});

	return result.user.id;
}

async function seed() {
	const department = await prisma.department.upsert({
		where: { code: "E2E" },
		update: {},
		create: { name: "E2E Test Dept", code: "E2E" },
	});

	const adminId = await upsertUser(E2E_ADMIN, department.id, "ADMIN");
	const senderId = await upsertUser(E2E_SENDER, department.id);
	const recipientId = await upsertUser(E2E_RECIPIENT, department.id);

	await prisma.recognitionCard.deleteMany({
		where: { OR: [{ senderId }, { recipientId }, { senderId: adminId }, { recipientId: adminId }] },
	});

	await prisma.appSetting.upsert({
		where: { key: "helpme_module_enabled" },
		update: { value: "true" },
		create: { key: "helpme_module_enabled", value: "true" },
	});

	console.log(`E2E seed complete. admin=${adminId} sender=${senderId} recipient=${recipientId}`);
}

seed()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
