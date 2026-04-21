import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "../app/generated/prisma/client";
import { prisma } from "../lib/db";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

async function reconcile() {
	const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
	const migrations = entries
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();

	let reconciled = 0;
	for (const name of migrations) {
		const file = path.join(MIGRATIONS_DIR, name, "migration.sql");
		const bytes = await fs.readFile(file);
		const checksum = crypto.createHash("sha256").update(bytes).digest("hex");

		const affected = await prisma.$executeRaw`
			UPDATE "_prisma_migrations"
			SET checksum = ${checksum}
			WHERE migration_name = ${name}
				AND checksum != ${checksum}
		`;
		if (affected > 0) {
			console.log(`  reconciled: ${name}`);
			reconciled += affected;
		}
	}

	if (reconciled > 0) {
		console.log(`Reconciled ${reconciled} migration checksum(s).`);
	}
}

async function main() {
	try {
		await reconcile();
	} catch (err) {
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
			return;
		}
		if (err instanceof Prisma.PrismaClientInitializationError) {
			return;
		}
		throw err;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((err) => {
	console.error("[reconcile-migration-checksums] failed:", err);
	process.exit(1);
});
