import type { Account, SavingsGoal, Transaction } from "@ruangdana/shared";

/** Total aset tercatat = jumlah saldo semua akun. Alokasi virtual TIDAK mengubah angka ini. */
export function totalAssets(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

/**
 * Tabungan virtual tetap berada di dalam akun, jadi hanya dikurangkan dari saldo tersedia.
 * Tabungan eksternal sudah ada di akun tersendiri, sehingga TIDAK dikurangkan lagi (hindari hitung ganda).
 */
export function virtualAllocation(goals: SavingsGoal[]): number {
  return goals.filter((g) => g.method === "VIRTUAL").reduce((s, g) => s + g.saved, 0);
}

export function availableBalance(accounts: Account[], goals: SavingsGoal[]): number {
  return totalAssets(accounts) - virtualAllocation(goals);
}

export function totalSavingsAllocation(goals: SavingsGoal[]): number {
  return goals.reduce((s, g) => s + g.saved, 0);
}

export function monthTotals(txs: Transaction[], yearMonth: string) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (!t.date.startsWith(yearMonth)) continue;
    if (t.type === "INCOME") income += t.amount;
    if (t.type === "EXPENSE") expense += t.amount;
  }
  return { income, expense };
}

export function goalProgress(g: SavingsGoal): number {
  return g.target <= 0 ? 0 : Math.min(100, (g.saved / g.target) * 100);
}
