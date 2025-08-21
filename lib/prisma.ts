/**
 * Prisma client wrapper for python-learning-app
 * Uses this app's own Prisma client and environment (DATABASE_URL in python-learning-app/.env).
 * No cross-app imports or proxying.
 */

import { PrismaClient } from "@prisma/client";

// Prevent hot-reload instantiation storms in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["error", "warn"], // enable if needed
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}