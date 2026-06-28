import { PrismaClient } from "@/app/generated/prisma/client";

function createPrismaClient() {
  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || "10";
  const url = process.env.DATABASE_URL || "";

  const hasParams = url.includes("?");
  const separator = hasParams ? "&" : "?";
  const pooledUrl = url.includes("connection_limit")
    ? url
    : `${url}${separator}connection_limit=${connectionLimit}&pool_timeout=10`;

  return new PrismaClient({
    datasources: { db: { url: pooledUrl } },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
