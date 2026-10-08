import type { Rupiah } from "./money";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type AccountType = "CASH" | "BANK" | "EWALLET" | "SAVINGS";
export type SavingsMethod = "VIRTUAL" | "EXTERNAL";

export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: Rupiah;
}

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  type: TransactionType;
  amount: Rupiah; // selalu positif; arah ditentukan oleh `type`
  accountId: string;
  toAccountId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  method: SavingsMethod;
  target: Rupiah;
  saved: Rupiah;
  targetDate: string;
  note?: string;
}

/** Pengguna yang sedang login (tanpa data sensitif). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  onboarded: boolean;
}

/** Akun keuangan milik pengguna, sebagaimana dikirim API. */
export interface AccountDto {
  id: string;
  name: string;
  type: AccountType;
  /** Saldo awal yang dicatat pengguna (Rupiah). */
  openingBalance: Rupiah;
  /**
   * Saldo berjalan. Pada Phase 2 sama dengan saldo awal karena belum ada transaksi;
   * mulai Phase 3 dihitung dari saldo awal + transaksi.
   */
  balance: Rupiah;
  archived: boolean;
  createdAt: string;
}

export interface ApiErrorBody {
  error: string;
  code?: string;
  fields?: Record<string, string>;
}

export type CategoryKind = "INCOME" | "EXPENSE";

export interface CategoryDto {
  id: string;
  name: string;
  kind: CategoryKind;
}

export interface TransactionDto {
  id: string;
  type: TransactionType;
  amount: Rupiah;
  /** yyyy-mm-dd */
  date: string;
  description: string;
  accountId: string;
  accountName: string;
  toAccountId: string | null;
  toAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: string;
}

export interface TransactionListResponse {
  transactions: TransactionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  /** yyyy-mm */
  month: string;
  /** Jumlah saldo semua akun aktif. Transfer dan (nanti) alokasi virtual tidak mengubah angka ini. */
  totalAssets: Rupiah;
  monthIncome: Rupiah;
  monthExpense: Rupiah;
  recent: TransactionDto[];
  expenseByCategory: Array<{ name: string; value: Rupiah }>;
  /** 6 bulan terakhir (termasuk bulan ini), urut naik. */
  trend: Array<{ month: string; income: Rupiah; expense: Rupiah }>;
}
