import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a SQL driver adapter. Local Docker Postgres uses pg;
// Neon (production) uses the Neon serverless adapter. Same DATABASE_URL.
function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = url.includes("neon.tech")
    ? new PrismaNeon({ connectionString: url })
    : new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy singleton: klien hanya dibuat saat query pertama, bukan saat modul
// diimpor — `next build` mengimpor modul tanpa DATABASE_URL.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    globalForPrisma.prisma ??= createPrisma();
    const value = Reflect.get(globalForPrisma.prisma as object, prop);
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
