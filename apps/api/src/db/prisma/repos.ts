import type { AccountType } from "@ruangdana/shared";
import { UniqueViolation } from "../../lib/errors";
import type { AccountRecord, Repos } from "../types";
import type { Prisma } from "./client";
import { createPrismaCategories, createPrismaLedger } from "./ledger";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "P2002";
}

/** BigInt di database -> number di aplikasi; menolak nilai di luar rentang aman. */
function toRupiah(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Nilai uang di luar rentang aman");
  return n;
}

type AccountRow = {
  id: string;
  userId: string;
  name: string;
  type: string;
  openingBalance: bigint;
  archivedAt: Date | null;
  createdAt: Date;
};

function toAccount(row: AccountRow): AccountRecord {
  return { ...row, type: row.type as AccountType, openingBalance: toRupiah(row.openingBalance) };
}

export function createPrismaRepos(prisma: Prisma): Repos {
  return {
    users: {
      findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
      findById: (id) => prisma.user.findUnique({ where: { id } }),
      async create(data) {
        try {
          return await prisma.user.create({ data });
        } catch (err) {
          if (isUniqueViolation(err)) throw new UniqueViolation();
          throw err;
        }
      },
      async update(id, data) {
        const result = await prisma.user.updateMany({ where: { id }, data });
        return result.count === 0 ? null : prisma.user.findUnique({ where: { id } });
      },
    },

    sessions: {
      create: (data) => prisma.session.create({ data }),
      async findValidByTokenHash(tokenHash, now) {
        const row = await prisma.session.findFirst({
          where: { tokenHash, expiresAt: { gt: now } },
          include: { user: true },
        });
        if (!row) return null;
        const { user, ...session } = row;
        return { session, user };
      },
      async deleteByTokenHash(tokenHash) {
        await prisma.session.deleteMany({ where: { tokenHash } });
      },
      async deleteAllForUser(userId, exceptTokenHash) {
        await prisma.session.deleteMany({
          where: { userId, ...(exceptTokenHash ? { tokenHash: { not: exceptTokenHash } } : {}) },
        });
      },
    },

    accounts: {
      async listByUser(userId, includeArchived) {
        const rows = await prisma.account.findMany({
          where: { userId, ...(includeArchived ? {} : { archivedAt: null }) },
          orderBy: { createdAt: "asc" },
        });
        return rows.map(toAccount);
      },
      async findOwned(userId, id) {
        const row = await prisma.account.findFirst({ where: { id, userId } });
        return row ? toAccount(row) : null;
      },
      async create(data) {
        try {
          const row = await prisma.account.create({
            data: { ...data, openingBalance: BigInt(data.openingBalance) },
          });
          return toAccount(row);
        } catch (err) {
          if (isUniqueViolation(err)) throw new UniqueViolation();
          throw err;
        }
      },
      async update(userId, id, data) {
        try {
          const { openingBalance, ...rest } = data;
          // updateMany dengan { id, userId } memastikan hanya akun milik pengguna yang berubah.
          const result = await prisma.account.updateMany({
            where: { id, userId },
            data: { ...rest, ...(openingBalance !== undefined ? { openingBalance: BigInt(openingBalance) } : {}) },
          });
          if (result.count === 0) return null;
          const row = await prisma.account.findFirst({ where: { id, userId } });
          return row ? toAccount(row) : null;
        } catch (err) {
          if (isUniqueViolation(err)) throw new UniqueViolation();
          throw err;
        }
      },
    },

    categories: createPrismaCategories(prisma),
    ledger: createPrismaLedger(prisma),
  };
}
