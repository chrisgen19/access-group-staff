import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
		// Recycle idle sockets before any NAT/proxy/server-side reaper closes them.
		idleTimeoutMillis: 30_000,
		keepAlive: true,
		keepAliveInitialDelayMillis: 10_000,
		// Fail fast instead of hanging when the database is unreachable.
		connectionTimeoutMillis: 10_000,
		max: 10,
	});
	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
