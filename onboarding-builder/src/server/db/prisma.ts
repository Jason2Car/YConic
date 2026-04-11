import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("user:password")) {
    console.warn("⚠️  DATABASE_URL not configured. Database features disabled.");
    return null;
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
