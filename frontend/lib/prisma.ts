import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in dev and warm serverless invocations.
// Runtime queries use DATABASE_URL (Supabase pooler); migrations use DIRECT_URL,
// both configured in prisma/schema.prisma.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
