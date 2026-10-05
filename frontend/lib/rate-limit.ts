import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Records one attempt for each key and reports whether any key is over its
 * limit in the last 15 minutes. Stored in the database so it holds across
 * serverless instances.
 */
export async function isRateLimited(limits: { key: string; max: number }[]) {
  const since = new Date(Date.now() - WINDOW_MS);

  const counts = await Promise.all(
    limits.map(({ key }) => prisma.reviewAttempt.count({ where: { key, createdAt: { gte: since } } }))
  );
  const limited = limits.some(({ max }, index) => counts[index] >= max);

  await prisma.reviewAttempt.createMany({ data: limits.map(({ key }) => ({ key })) });
  // Housekeeping: drop rows that can no longer count towards any limit.
  await prisma.reviewAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });

  return limited;
}
