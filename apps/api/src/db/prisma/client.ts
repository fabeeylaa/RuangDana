// CATATAN: file di folder src/db/prisma/ bergantung pada client hasil `npx prisma generate`
// (src/generated/prisma, tidak dimasukkan ke repo). Jalankan generate sebelum typecheck/dev.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

export function createPrisma(connectionString: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export type Prisma = ReturnType<typeof createPrisma>;
