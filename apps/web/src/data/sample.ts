/**
 * DATA CONTOH (FIKTIF) — hanya untuk Phase 1.
 * Akan diganti data nyata dari API pada fase berikutnya.
 */
import type { Account, SavingsGoal, Transaction } from "@ruangdana/shared";

export const sampleAccounts: Account[] = [
  { id: "a1", name: "Tunai", type: "CASH", balance: 350_000 },
  { id: "a2", name: "Rekening Bank", type: "BANK", balance: 4_200_000 },
  { id: "a3", name: "E-Wallet", type: "EWALLET", balance: 780_000 },
  { id: "a4", name: "Tabungan Berjangka", type: "SAVINGS", balance: 1_500_000 },
];

export const sampleCategories = {
  INCOME: ["Uang Saku", "Gaji Part-time", "Beasiswa", "Lainnya"],
  EXPENSE: ["Makanan", "Transportasi", "Pendidikan", "Hiburan", "Tagihan", "Belanja"],
} as const;

export const sampleTransactions: Transaction[] = [
  { id: "t1", date: "2026-10-07", description: "Makan siang kantin", category: "Makanan", type: "EXPENSE", amount: 28_000, accountId: "a3" },
  { id: "t2", date: "2026-10-06", description: "Ojek online ke kampus", category: "Transportasi", type: "EXPENSE", amount: 19_000, accountId: "a3" },
  { id: "t3", date: "2026-10-05", description: "Honor mengajar privat", category: "Gaji Part-time", type: "INCOME", amount: 750_000, accountId: "a2" },
  { id: "t4", date: "2026-10-04", description: "Fotokopi modul", category: "Pendidikan", type: "EXPENSE", amount: 35_000, accountId: "a1" },
  { id: "t5", date: "2026-10-03", description: "Langganan streaming", category: "Hiburan", type: "EXPENSE", amount: 54_000, accountId: "a2" },
  { id: "t6", date: "2026-10-02", description: "Paket data bulanan", category: "Tagihan", type: "EXPENSE", amount: 65_000, accountId: "a3" },
  { id: "t7", date: "2026-10-01", description: "Uang saku bulanan", category: "Uang Saku", type: "INCOME", amount: 2_500_000, accountId: "a2" },
  { id: "t8", date: "2026-10-01", description: "Tarik tunai ke dompet", category: "Transfer", type: "TRANSFER", amount: 300_000, accountId: "a2", toAccountId: "a1" },
  { id: "t9", date: "2026-09-29", description: "Buku referensi", category: "Pendidikan", type: "EXPENSE", amount: 120_000, accountId: "a2" },
  { id: "t10", date: "2026-09-27", description: "Nonton bioskop", category: "Hiburan", type: "EXPENSE", amount: 50_000, accountId: "a3" },
];

export const sampleGoals: SavingsGoal[] = [
  { id: "g1", name: "Laptop Baru", method: "VIRTUAL", target: 8_000_000, saved: 3_200_000, targetDate: "2027-03-31", note: "Dialokasikan dari saldo Rekening Bank" },
  { id: "g2", name: "Dana Darurat", method: "EXTERNAL", target: 5_000_000, saved: 1_500_000, targetDate: "2027-06-30", note: "Disimpan di Tabungan Berjangka" },
  { id: "g3", name: "Liburan Akhir Semester", method: "VIRTUAL", target: 2_000_000, saved: 2_000_000, targetDate: "2026-12-15", note: "Target tercapai" },
];

export const sampleExpenseBreakdown = [
  { name: "Makanan", value: 640_000 },
  { name: "Transportasi", value: 310_000 },
  { name: "Pendidikan", value: 155_000 },
  { name: "Hiburan", value: 104_000 },
  { name: "Tagihan", value: 65_000 },
];

export const sampleMonthlyTrend = [
  { month: "Mei", income: 2_800_000, expense: 1_900_000 },
  { month: "Jun", income: 3_000_000, expense: 1_650_000 },
  { month: "Jul", income: 2_500_000, expense: 1_800_000 },
  { month: "Agu", income: 3_400_000, expense: 2_100_000 },
  { month: "Sep", income: 3_100_000, expense: 1_750_000 },
  { month: "Okt", income: 3_250_000, expense: 1_274_000 },
];
