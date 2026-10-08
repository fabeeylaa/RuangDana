// CATATAN: bergantung pada client hasil `npx prisma generate`. BELUM diverifikasi (typecheck/eksekusi)
// pada lingkungan tempat kode ini ditulis; lihat README bagian "Verifikasi bagian Prisma".
import type { TransactionType } from "@ruangdana/shared";
import { DEFAULT_CATEGORIES } from "../default-categories";
import { UniqueViolation } from "../../lib/errors";
import type {
  CategoryRepo, LedgerRepo, LedgerTx, NewTransaction, TransactionFilters, TransactionPatch, TransactionRecord,
} from "../types";
import type { Prisma } from "./client";

/** Cukup untuk PrismaClient maupun klien di dalam $transaction. */
type Db = Pick<Prisma, "account" | "transaction" | "category" | "$queryRaw">;

function toRupiah(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Nilai uang di luar rentang aman");
  return n;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const toDbDate = (s: string) => new Date(`${s}T00:00:00.000Z`);

const include = {
  account: { select: { name: true } },
  toAccount: { select: { name: true } },
  category: { select: { name: true } },
} as const;

interface Row {
  id: string;
  userId: string;
  type: TransactionType;
  amount: bigint;
  date: Date;
  description: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  createdAt: Date;
  account: { name: string };
  toAccount: { name: string } | null;
  category: { name: string } | null;
}

function toRecord(r: Row): TransactionRecord {
  return {
    id: r.id, userId: r.userId, type: r.type, amount: toRupiah(r.amount), date: isoDate(r.date),
    description: r.description,
    accountId: r.accountId, accountName: r.account.name,
    toAccountId: r.toAccountId, toAccountName: r.toAccount?.name ?? null,
    categoryId: r.categoryId, categoryName: r.category?.name ?? null,
    createdAt: r.createdAt,
  };
}

/**
 * Saldo berjalan = saldo awal + pemasukan − pengeluaran − transfer keluar + transfer masuk,
 * hanya dari transaksi yang belum di-soft-delete. Dihitung dengan agregasi di database.
 */
async function balancesFor(db: Db, userId: string, accountIds?: string[]): Promise<Record<string, number>> {
  const idFilter = accountIds ? { in: accountIds } : undefined;

  const accounts = await db.account.findMany({
    where: { userId, ...(idFilter ? { id: idFilter } : {}) },
    select: { id: true, openingBalance: true },
  });
  const out: Record<string, number> = {};
  for (const a of accounts) out[a.id] = toRupiah(a.openingBalance);

  const bySource = await db.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, deletedAt: null, ...(idFilter ? { accountId: idFilter } : {}) },
    _sum: { amount: true },
  });
  for (const g of bySource) {
    if (!(g.accountId in out)) continue;
    const sum = toRupiah(g._sum.amount ?? 0n);
    out[g.accountId] = (out[g.accountId] ?? 0) + (g.type === "INCOME" ? sum : -sum); // EXPENSE dan TRANSFER keluar mengurangi
  }

  const byTarget = await db.transaction.groupBy({
    by: ["toAccountId"],
    where: { userId, deletedAt: null, type: "TRANSFER", ...(idFilter ? { toAccountId: idFilter } : {}) },
    _sum: { amount: true },
  });
  for (const g of byTarget) {
    if (!g.toAccountId || !(g.toAccountId in out)) continue;
    out[g.toAccountId] = (out[g.toAccountId] ?? 0) + toRupiah(g._sum.amount ?? 0n);
  }
  return out;
}

function makeTx(db: Db, userId: string): LedgerTx {
  const findRow = (id: string) => db.transaction.findFirst({ where: { id, userId, deletedAt: null }, include });

  return {
    async findAccount(id) {
      const a = await db.account.findFirst({ where: { id, userId } });
      return a ? { id: a.id, name: a.name, archived: a.archivedAt !== null, openingBalance: toRupiah(a.openingBalance) } : null;
    },
    async balanceOf(accountId) {
      return (await balancesFor(db, userId, [accountId]))[accountId] ?? 0;
    },
    async findCategory(id) {
      return db.category.findFirst({ where: { id, userId } });
    },
    async findTransaction(id) {
      const row = await findRow(id);
      return row ? toRecord(row) : null;
    },
    async insert(data: NewTransaction) {
      const row = await db.transaction.create({
        data: {
          userId, type: data.type, amount: BigInt(data.amount), date: toDbDate(data.date), description: data.description,
          accountId: data.accountId, toAccountId: data.toAccountId, categoryId: data.categoryId,
        },
        include,
      });
      return toRecord(row);
    },
    async update(id: string, patch: TransactionPatch) {
      await db.transaction.updateMany({
        where: { id, userId, deletedAt: null },
        data: {
          ...(patch.amount !== undefined ? { amount: BigInt(patch.amount) } : {}),
          ...(patch.date !== undefined ? { date: toDbDate(patch.date) } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.accountId !== undefined ? { accountId: patch.accountId } : {}),
          ...(patch.toAccountId !== undefined ? { toAccountId: patch.toAccountId } : {}),
          ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
        },
      });
      const row = await findRow(id);
      if (!row) throw new Error("Transaksi hilang saat diperbarui");
      return toRecord(row);
    },
    async softDelete(id) {
      await db.transaction.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
    },
    async setOpeningBalance(accountId, value) {
      await db.account.updateMany({ where: { id: accountId, userId }, data: { openingBalance: BigInt(value) } });
    },
    async setArchived(accountId, archivedAt) {
      await db.account.updateMany({ where: { id: accountId, userId }, data: { archivedAt } });
    },
  };
}

export function createPrismaLedger(prisma: Prisma): LedgerRepo {
  return {
    async atomically(userId, lockAccountIds, fn) {
      return prisma.$transaction(
        async (db) => {
          // Kunci baris akun berurutan menurut id (mencegah deadlock), satu per satu dengan parameter skalar.
          for (const id of [...new Set(lockAccountIds)].sort()) {
            await db.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${id}::uuid AND "userId" = ${userId}::uuid FOR UPDATE`;
          }
          return fn(makeTx(db, userId));
        },
        { maxWait: 5_000, timeout: 10_000 },
      );
    },

    async findTransaction(userId, id) {
      const row = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null }, include });
      return row ? toRecord(row) : null;
    },

    async list(userId, f: TransactionFilters) {
      const q = f.search?.trim();
      const where = {
        userId,
        deletedAt: null,
        ...(f.type ? { type: f.type } : {}),
        ...(f.categoryId ? { categoryId: f.categoryId } : {}),
        ...(f.dateFrom || f.dateTo
          ? { date: { ...(f.dateFrom ? { gte: toDbDate(f.dateFrom) } : {}), ...(f.dateTo ? { lte: toDbDate(f.dateTo) } : {}) } }
          : {}),
        AND: [
          ...(f.accountId ? [{ OR: [{ accountId: f.accountId }, { toAccountId: f.accountId }] }] : []),
          ...(q
            ? [{
                OR: [
                  { description: { contains: q, mode: "insensitive" as const } },
                  { category: { name: { contains: q, mode: "insensitive" as const } } },
                ],
              }]
            : []),
        ],
      };
      const [rows, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          skip: (f.page - 1) * f.pageSize,
          take: f.pageSize,
        }),
        prisma.transaction.count({ where }),
      ]);
      return { items: rows.map(toRecord), total };
    },

    async listBetween(userId, from, to) {
      const rows = await prisma.transaction.findMany({
        where: { userId, deletedAt: null, date: { gte: toDbDate(from), lte: toDbDate(to) } },
        include,
      });
      return rows.map(toRecord);
    },

    balances: (userId) => balancesFor(prisma, userId),
  };
}

export function createPrismaCategories(prisma: Prisma): CategoryRepo {
  return {
    async ensureDefaults(userId) {
      if ((await prisma.category.count({ where: { userId } })) > 0) return;
      await prisma.category.createMany({ data: DEFAULT_CATEGORIES.map((c) => ({ userId, ...c })), skipDuplicates: true });
    },
    list: (userId) => prisma.category.findMany({ where: { userId }, orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    async create(userId, data) {
      try {
        return await prisma.category.create({ data: { userId, ...data } });
      } catch (err) {
        if (typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "P2002") {
          throw new UniqueViolation();
        }
        throw err;
      }
    },
  };
}
