import type { AccountType, CategoryKind, TransactionType } from "@ruangdana/shared";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  onboardedAt: Date | null;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface AccountRecord {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  /** Rupiah, bilangan bulat aman. */
  openingBalance: number;
  archivedAt: Date | null;
  createdAt: Date;
}

export interface UserRepo {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /** Melempar UniqueViolation bila email sudah dipakai. */
  create(data: { email: string; name: string; passwordHash: string }): Promise<UserRecord>;
  update(id: string, data: { name?: string; onboardedAt?: Date; passwordHash?: string }): Promise<UserRecord | null>;
}

export interface SessionRepo {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<SessionRecord>;
  /** Hanya mengembalikan sesi yang belum kedaluwarsa. */
  findValidByTokenHash(tokenHash: string, now: Date): Promise<{ session: SessionRecord; user: UserRecord } | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  /** Hapus semua sesi pengguna kecuali sesi dengan tokenHash tertentu (opsional). */
  deleteAllForUser(userId: string, exceptTokenHash?: string): Promise<void>;
}

/**
 * Semua operasi akun WAJIB menyertakan userId sebagai bagian dari kondisi query,
 * sehingga otorisasi ditegakkan di lapisan data, bukan hanya di route.
 */
export interface AccountRepo {
  listByUser(userId: string, includeArchived: boolean): Promise<AccountRecord[]>;
  findOwned(userId: string, id: string): Promise<AccountRecord | null>;
  /** Melempar UniqueViolation bila nama sudah dipakai pengguna yang sama. */
  create(data: { userId: string; name: string; type: AccountType; openingBalance: number }): Promise<AccountRecord>;
  /** Mengembalikan null bila akun bukan milik userId. Melempar UniqueViolation bila nama bentrok. */
  update(
    userId: string,
    id: string,
    data: { name?: string; type?: AccountType; openingBalance?: number; archivedAt?: Date | null },
  ): Promise<AccountRecord | null>;
}

export interface CategoryRecord {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
}

export interface CategoryRepo {
  /** Membuat kategori bawaan bila pengguna belum punya satu pun. Aman dipanggil berulang/bersamaan. */
  ensureDefaults(userId: string): Promise<void>;
  list(userId: string): Promise<CategoryRecord[]>;
  /** Melempar UniqueViolation bila nama sudah ada pada jenis yang sama. */
  create(userId: string, data: { name: string; kind: CategoryKind }): Promise<CategoryRecord>;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: TransactionType;
  /** Rupiah, selalu positif. */
  amount: number;
  /** yyyy-mm-dd */
  date: string;
  description: string;
  accountId: string;
  accountName: string;
  toAccountId: string | null;
  toAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: Date;
}

export interface NewTransaction {
  userId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
}

export type TransactionPatch = Partial<Omit<NewTransaction, "userId" | "type">>;

export interface TransactionFilters {
  search?: string;
  type?: TransactionType;
  /** Cocok bila akun menjadi sumber ATAU tujuan transaksi. */
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface AccountInfo {
  id: string;
  name: string;
  archived: boolean;
  openingBalance: number;
}

/**
 * Operasi di dalam satu unit kerja atomik. Semua akun yang dikunci (FOR UPDATE) pada
 * `LedgerRepo.atomically` aman dibaca-lalu-ditulis tanpa balapan dengan permintaan lain.
 * Semua pencarian dibatasi pada pengguna pemilik unit kerja ini.
 */
export interface LedgerTx {
  findAccount(id: string): Promise<AccountInfo | null>;
  /** Saldo berjalan = saldo awal + pemasukan − pengeluaran − transfer keluar + transfer masuk (tanpa transaksi terhapus). */
  balanceOf(accountId: string): Promise<number>;
  findCategory(id: string): Promise<CategoryRecord | null>;
  findTransaction(id: string): Promise<TransactionRecord | null>;
  insert(data: NewTransaction): Promise<TransactionRecord>;
  update(id: string, patch: TransactionPatch): Promise<TransactionRecord>;
  /** Soft delete: baris tetap ada sebagai riwayat, tetapi tidak dihitung ke saldo. */
  softDelete(id: string): Promise<void>;
  setOpeningBalance(accountId: string, value: number): Promise<void>;
  setArchived(accountId: string, archivedAt: Date | null): Promise<void>;
}

export interface LedgerRepo {
  /**
   * Menjalankan `fn` dalam satu transaksi database setelah mengunci baris akun
   * (urut berdasarkan id untuk mencegah deadlock). Bila `fn` melempar, semua perubahan dibatalkan.
   */
  atomically<T>(userId: string, lockAccountIds: string[], fn: (tx: LedgerTx) => Promise<T>): Promise<T>;
  /** Pembacaan tanpa kunci, dipakai untuk merencanakan akun mana yang perlu dikunci. */
  findTransaction(userId: string, id: string): Promise<TransactionRecord | null>;
  list(userId: string, filters: TransactionFilters): Promise<{ items: TransactionRecord[]; total: number }>;
  /** Transaksi (tanpa yang terhapus) pada rentang tanggal inklusif yyyy-mm-dd. */
  listBetween(userId: string, from: string, to: string): Promise<TransactionRecord[]>;
  /** Saldo berjalan semua akun milik pengguna (termasuk yang diarsipkan), kunci = id akun. */
  balances(userId: string): Promise<Record<string, number>>;
}

export interface Repos {
  users: UserRepo;
  sessions: SessionRepo;
  accounts: AccountRepo;
  categories: CategoryRepo;
  ledger: LedgerRepo;
}
