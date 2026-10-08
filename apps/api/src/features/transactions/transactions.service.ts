import { formatRupiah, MAX_BALANCE, type TransactionDto, type TransactionType } from "@ruangdana/shared";
import type { LedgerTx, Repos, TransactionFilters, TransactionPatch, TransactionRecord } from "../../db/types";
import { badRequest, conflict, notFound, unprocessable } from "../../lib/errors";

/** Bentuk transaksi yang dipakai untuk menghitung efeknya ke saldo. */
interface Draft {
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
}

export function toTransactionDto(t: TransactionRecord): TransactionDto {
  return {
    id: t.id, type: t.type, amount: t.amount, date: t.date, description: t.description,
    accountId: t.accountId, accountName: t.accountName,
    toAccountId: t.toAccountId, toAccountName: t.toAccountName,
    categoryId: t.categoryId, categoryName: t.categoryName,
    createdAt: t.createdAt.toISOString(),
  };
}

function draftOf(t: TransactionRecord): Draft {
  return {
    type: t.type, amount: t.amount, date: t.date, description: t.description,
    accountId: t.accountId, toAccountId: t.toAccountId, categoryId: t.categoryId,
  };
}

/**
 * Efek transaksi terhadap saldo tiap akun.
 * Pemasukan menambah, pengeluaran mengurangi, transfer memindahkan (jumlah efek total = 0,
 * sehingga total aset tidak berubah).
 */
function effects(d: Draft): Record<string, number> {
  if (d.type === "INCOME") return { [d.accountId]: d.amount };
  if (d.type === "EXPENSE") return { [d.accountId]: -d.amount };
  return { [d.accountId]: -d.amount, [d.toAccountId as string]: d.amount };
}

/** Perubahan saldo bersih per akun bila `before` diganti menjadi `after`. Entri bernilai 0 dibuang. */
function netDeltas(before: Draft | null, after: Draft | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(before ? effects(before) : {})) out[id] = (out[id] ?? 0) - v;
  for (const [id, v] of Object.entries(after ? effects(after) : {})) out[id] = (out[id] ?? 0) + v;
  for (const id of Object.keys(out)) if (out[id] === 0) delete out[id];
  return out;
}

async function accountName(tx: LedgerTx, id: string) {
  return (await tx.findAccount(id))?.name ?? "akun";
}

/** Setiap akun yang saldonya berubah harus aktif (akun diarsipkan dibekukan). */
async function assertActive(tx: LedgerTx, deltas: Record<string, number>) {
  for (const id of Object.keys(deltas)) {
    const acc = await tx.findAccount(id);
    if (acc?.archived) {
      throw badRequest("Akun yang diarsipkan tidak dapat diubah saldonya.", {
        accountId: `Akun «${acc.name}» sudah diarsipkan. Pulihkan akun terlebih dahulu.`,
      });
    }
  }
}

/**
 * Aturan inti: setelah perubahan, saldo akun mana pun tidak boleh negatif dan tidak boleh melewati batas.
 * Dipanggil di dalam unit kerja atomik setelah akun terkait dikunci.
 */
async function assertBalances(tx: LedgerTx, deltas: Record<string, number>, action: "write" | "delete") {
  for (const [id, delta] of Object.entries(deltas)) {
    const balance = await tx.balanceOf(id);
    const next = balance + delta;
    if (next < 0) {
      const name = await accountName(tx, id);
      throw action === "delete"
        ? unprocessable(`Transaksi ini tidak bisa dihapus karena saldo akun «${name}» akan menjadi negatif.`, "BALANCE_WOULD_BE_NEGATIVE")
        : unprocessable(
            `Saldo akun «${name}» tidak mencukupi. Saldo saat ini ${formatRupiah(balance)}, dibutuhkan tambahan ${formatRupiah(-next)}.`,
            "INSUFFICIENT_BALANCE",
          );
    }
    if (!Number.isSafeInteger(next) || next > MAX_BALANCE) {
      throw unprocessable("Saldo akun melebihi batas yang didukung.", "BALANCE_LIMIT");
    }
  }
}

/** Akun/kategori harus ada dan milik pengguna (tx hanya melihat data pengguna tersebut). */
async function assertReferences(tx: LedgerTx, d: Draft, check: { accounts: string[]; category: boolean }) {
  const fields: Record<string, string> = {};
  if (d.type === "TRANSFER" && d.toAccountId === d.accountId) fields.toAccountId = "Akun tujuan harus berbeda dari akun asal.";
  for (const id of check.accounts) {
    if (!(await tx.findAccount(id))) fields[id === d.toAccountId ? "toAccountId" : "accountId"] = "Akun tidak ditemukan.";
  }
  if (check.category && d.type !== "TRANSFER" && d.categoryId) {
    const cat = await tx.findCategory(d.categoryId);
    if (!cat) fields.categoryId = "Kategori tidak ditemukan.";
    else if (cat.kind !== d.type) fields.categoryId = "Kategori tidak sesuai dengan jenis transaksi.";
  }
  if (Object.keys(fields).length > 0) throw badRequest("Data yang dikirim tidak valid.", fields);
}

const uniq = (ids: Array<string | null | undefined>) => [...new Set(ids.filter((x): x is string => !!x))];

export type CreateInput =
  | { type: "INCOME" | "EXPENSE"; amount: number; date: string; description: string; accountId: string; categoryId: string }
  | { type: "TRANSFER"; amount: number; date: string; description: string; accountId: string; toAccountId: string };

export function createTransactionsService(repos: Repos) {
  const { ledger } = repos;

  return {
    async list(userId: string, filters: TransactionFilters) {
      const { items, total } = await ledger.list(userId, filters);
      return { transactions: items.map(toTransactionDto), total, page: filters.page, pageSize: filters.pageSize };
    },

    async create(userId: string, input: CreateInput) {
      const draft: Draft = {
        type: input.type, amount: input.amount, date: input.date,
        description: input.description || (input.type === "TRANSFER" ? "Transfer antar akun" : ""),
        accountId: input.accountId,
        toAccountId: input.type === "TRANSFER" ? input.toAccountId : null,
        categoryId: input.type === "TRANSFER" ? null : input.categoryId,
      };
      const lock = uniq([draft.accountId, draft.toAccountId]);
      return ledger.atomically(userId, lock, async (tx) => {
        await assertReferences(tx, draft, { accounts: lock, category: true });
        const deltas = netDeltas(null, draft);
        await assertActive(tx, deltas);
        await assertBalances(tx, deltas, "write");
        return toTransactionDto(await tx.insert({ userId, ...draft }));
      });
    },

    async update(userId: string, id: string, patch: TransactionPatch) {
      const planned = await ledger.findTransaction(userId, id);
      if (!planned) throw notFound("Transaksi tidak ditemukan.");

      const lock = uniq([planned.accountId, planned.toAccountId, patch.accountId, patch.toAccountId]);
      return ledger.atomically(userId, lock, async (tx) => {
        const existing = await tx.findTransaction(id);
        if (!existing) throw notFound("Transaksi tidak ditemukan.");
        if (![existing.accountId, existing.toAccountId].every((a) => !a || lock.includes(a))) {
          throw conflict("Data berubah saat diproses. Coba lagi.", "CONFLICT_RETRY");
        }
        if (existing.type === "TRANSFER" && patch.categoryId !== undefined) {
          throw badRequest("Data yang dikirim tidak valid.", { categoryId: "Transfer tidak memakai kategori." });
        }
        if (existing.type !== "TRANSFER" && patch.toAccountId !== undefined) {
          throw badRequest("Data yang dikirim tidak valid.", { toAccountId: "Hanya transfer yang punya akun tujuan." });
        }

        const before = draftOf(existing);
        const after: Draft = { ...before, ...patch };
        const changedAccounts = uniq([
          patch.accountId !== undefined && patch.accountId !== before.accountId ? after.accountId : null,
          patch.toAccountId !== undefined && patch.toAccountId !== before.toAccountId ? after.toAccountId : null,
        ]);
        await assertReferences(tx, after, { accounts: changedAccounts, category: patch.categoryId !== undefined });

        const deltas = netDeltas(before, after);
        await assertActive(tx, deltas);
        await assertBalances(tx, deltas, "write");
        return toTransactionDto(await tx.update(id, patch));
      });
    },

    async remove(userId: string, id: string) {
      const planned = await ledger.findTransaction(userId, id);
      if (!planned) throw notFound("Transaksi tidak ditemukan.");
      const lock = uniq([planned.accountId, planned.toAccountId]);
      await ledger.atomically(userId, lock, async (tx) => {
        const existing = await tx.findTransaction(id);
        if (!existing) throw notFound("Transaksi tidak ditemukan.");
        const deltas = netDeltas(draftOf(existing), null);
        await assertActive(tx, deltas);
        await assertBalances(tx, deltas, "delete");
        await tx.softDelete(id);
      });
    },
  };
}

export type TransactionsService = ReturnType<typeof createTransactionsService>;
