import { randomUUID } from "node:crypto";
import { DEFAULT_CATEGORIES } from "../db/default-categories";
import { UniqueViolation } from "../lib/errors";
import type {
  AccountRecord, CategoryRecord, LedgerTx, Repos, SessionRecord, TransactionRecord, UserRecord,
} from "../db/types";

/** Bagian internal: transaksi plus penanda soft delete (tidak keluar dari repository). */
interface StoredTx {
  id: string; userId: string; type: TransactionRecord["type"]; amount: number; date: string;
  description: string; accountId: string; toAccountId: string | null; categoryId: string | null;
  deletedAt: Date | null; createdAt: Date;
}

/** Menyerahkan giliran ke event loop, agar tes benar-benar menguji interleaving permintaan paralel. */
const tick = () => new Promise<void>((r) => setImmediate(r));

/**
 * Implementasi in-memory HANYA untuk tes otomatis (tidak dipakai server).
 * Meniru kontrak repository: filter userId, unique constraint, soft delete, dan unit kerja atomik
 * yang diserialkan (pengganti FOR UPDATE pada PostgreSQL).
 */
export function createMemoryRepos(): Repos {
  const users: UserRecord[] = [];
  const sessions: SessionRecord[] = [];
  const accounts: AccountRecord[] = [];
  const categories: CategoryRecord[] = [];
  const txs: StoredTx[] = [];

  const accountName = (id: string | null) => (id ? accounts.find((a) => a.id === id)?.name ?? null : null);
  const categoryName = (id: string | null) => (id ? categories.find((c) => c.id === id)?.name ?? null : null);

  const toRecord = (t: StoredTx): TransactionRecord => ({
    id: t.id, userId: t.userId, type: t.type, amount: t.amount, date: t.date, description: t.description,
    accountId: t.accountId, accountName: accountName(t.accountId) ?? "",
    toAccountId: t.toAccountId, toAccountName: accountName(t.toAccountId),
    categoryId: t.categoryId, categoryName: categoryName(t.categoryId),
    createdAt: t.createdAt,
  });

  const live = (userId: string) => txs.filter((t) => t.userId === userId && !t.deletedAt);

  function balanceOf(userId: string, accountId: string): number {
    const acc = accounts.find((a) => a.id === accountId && a.userId === userId);
    if (!acc) return 0;
    let b = acc.openingBalance;
    for (const t of live(userId)) {
      if (t.type === "INCOME" && t.accountId === accountId) b += t.amount;
      if (t.type === "EXPENSE" && t.accountId === accountId) b -= t.amount;
      if (t.type === "TRANSFER") {
        if (t.accountId === accountId) b -= t.amount;
        if (t.toAccountId === accountId) b += t.amount;
      }
    }
    return b;
  }

  function makeTx(userId: string): LedgerTx {
    const ownAccount = (id: string) => accounts.find((a) => a.id === id && a.userId === userId);
    return {
      async findAccount(id) {
        await tick();
        const a = ownAccount(id);
        return a ? { id: a.id, name: a.name, archived: a.archivedAt !== null, openingBalance: a.openingBalance } : null;
      },
      async balanceOf(accountId) { await tick(); return balanceOf(userId, accountId); },
      async findCategory(id) { await tick(); return categories.find((c) => c.id === id && c.userId === userId) ?? null; },
      async findTransaction(id) {
        await tick();
        const t = live(userId).find((x) => x.id === id);
        return t ? toRecord(t) : null;
      },
      async insert(data) {
        await tick();
        const t: StoredTx = { id: randomUUID(), deletedAt: null, createdAt: new Date(), ...data };
        txs.push(t);
        return toRecord(t);
      },
      async update(id, patch) {
        await tick();
        const t = live(userId).find((x) => x.id === id)!;
        Object.assign(t, patch);
        return toRecord(t);
      },
      async softDelete(id) {
        await tick();
        const t = live(userId).find((x) => x.id === id);
        if (t) t.deletedAt = new Date();
      },
      async setOpeningBalance(accountId, value) { await tick(); const a = ownAccount(accountId); if (a) a.openingBalance = value; },
      async setArchived(accountId, archivedAt) { await tick(); const a = ownAccount(accountId); if (a) a.archivedAt = archivedAt; },
    };
  }

  let queue: Promise<unknown> = Promise.resolve();

  return {
    users: {
      async findByEmail(email) { return users.find((u) => u.email === email) ?? null; },
      async findById(id) { return users.find((u) => u.id === id) ?? null; },
      async create(data) {
        if (users.some((u) => u.email === data.email)) throw new UniqueViolation();
        const user: UserRecord = { id: randomUUID(), onboardedAt: null, ...data };
        users.push(user);
        return user;
      },
      async update(id, data) {
        const u = users.find((x) => x.id === id);
        if (!u) return null;
        Object.assign(u, data);
        return u;
      },
    },
    sessions: {
      async create(data) {
        const s: SessionRecord = { id: randomUUID(), ...data };
        sessions.push(s);
        return s;
      },
      async findValidByTokenHash(tokenHash, now) {
        const s = sessions.find((x) => x.tokenHash === tokenHash && x.expiresAt > now);
        const u = s && users.find((x) => x.id === s.userId);
        return s && u ? { session: s, user: u } : null;
      },
      async deleteByTokenHash(tokenHash) {
        for (let i = sessions.length - 1; i >= 0; i--) if (sessions[i]!.tokenHash === tokenHash) sessions.splice(i, 1);
      },
      async deleteAllForUser(userId, except) {
        for (let i = sessions.length - 1; i >= 0; i--) {
          const s = sessions[i]!;
          if (s.userId === userId && s.tokenHash !== except) sessions.splice(i, 1);
        }
      },
    },
    accounts: {
      async listByUser(userId, includeArchived) {
        return accounts.filter((a) => a.userId === userId && (includeArchived || !a.archivedAt));
      },
      async findOwned(userId, id) { return accounts.find((a) => a.id === id && a.userId === userId) ?? null; },
      async create(data) {
        if (accounts.some((a) => a.userId === data.userId && a.name === data.name)) throw new UniqueViolation();
        const a: AccountRecord = { id: randomUUID(), archivedAt: null, createdAt: new Date(), ...data };
        accounts.push(a);
        return a;
      },
      async update(userId, id, data) {
        const a = accounts.find((x) => x.id === id && x.userId === userId);
        if (!a) return null;
        if (data.name && accounts.some((x) => x.userId === userId && x.id !== id && x.name === data.name)) throw new UniqueViolation();
        for (const [k, v] of Object.entries(data)) if (v !== undefined) (a as unknown as Record<string, unknown>)[k] = v;
        return a;
      },
    },
    categories: {
      async ensureDefaults(userId) {
        if (categories.some((c) => c.userId === userId)) return;
        for (const c of DEFAULT_CATEGORIES) categories.push({ id: randomUUID(), userId, ...c });
      },
      async list(userId) { return categories.filter((c) => c.userId === userId); },
      async create(userId, data) {
        if (categories.some((c) => c.userId === userId && c.kind === data.kind && c.name === data.name)) throw new UniqueViolation();
        const c: CategoryRecord = { id: randomUUID(), userId, ...data };
        categories.push(c);
        return c;
      },
    },
    ledger: {
      atomically(userId, _lockAccountIds, fn) {
        const run = queue.then(() => fn(makeTx(userId)));
        queue = run.then(() => undefined, () => undefined);
        return run;
      },
      async findTransaction(userId, id) {
        const t = live(userId).find((x) => x.id === id);
        return t ? toRecord(t) : null;
      },
      async list(userId, f) {
        const q = f.search?.toLowerCase();
        const rows = live(userId)
          .filter((t) => !f.type || t.type === f.type)
          .filter((t) => !f.accountId || t.accountId === f.accountId || t.toAccountId === f.accountId)
          .filter((t) => !f.categoryId || t.categoryId === f.categoryId)
          .filter((t) => !f.dateFrom || t.date >= f.dateFrom)
          .filter((t) => !f.dateTo || t.date <= f.dateTo)
          .filter((t) => !q || t.description.toLowerCase().includes(q) || (categoryName(t.categoryId) ?? "").toLowerCase().includes(q))
          .sort((a, b) => (a.date === b.date ? b.createdAt.getTime() - a.createdAt.getTime() : a.date < b.date ? 1 : -1));
        const start = (f.page - 1) * f.pageSize;
        return { items: rows.slice(start, start + f.pageSize).map(toRecord), total: rows.length };
      },
      async listBetween(userId, from, to) {
        return live(userId).filter((t) => t.date >= from && t.date <= to).map(toRecord);
      },
      async balances(userId) {
        const out: Record<string, number> = {};
        for (const a of accounts.filter((x) => x.userId === userId)) out[a.id] = balanceOf(userId, a.id);
        return out;
      },
    },
  };
}
