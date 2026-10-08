import type { DashboardSummary } from "@ruangdana/shared";
import type { Repos } from "../../db/types";
import { currentYearMonth, monthEnd, monthStart, shiftMonth } from "../../lib/dates";
import { toTransactionDto } from "../transactions/transactions.service";

export function createDashboardService(repos: Repos) {
  return {
    async summary(userId: string, month: string = currentYearMonth()): Promise<DashboardSummary> {
      const trendMonths = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));

      const [accounts, balances, range, recent] = await Promise.all([
        repos.accounts.listByUser(userId, false),
        repos.ledger.balances(userId),
        repos.ledger.listBetween(userId, monthStart(trendMonths[0]!), monthEnd(month)),
        repos.ledger.list(userId, { page: 1, pageSize: 5 }),
      ]);

      // Total aset hanya menghitung akun aktif. Transfer tidak ikut dihitung sebagai pemasukan/pengeluaran.
      const totalAssets = accounts.reduce((sum, a) => sum + (balances[a.id] ?? 0), 0);

      const trend = trendMonths.map((m) => ({ month: m, income: 0, expense: 0 }));
      const byCategory = new Map<string, number>();
      let monthIncome = 0;
      let monthExpense = 0;

      for (const t of range) {
        if (t.type === "TRANSFER") continue;
        const bucket = trend.find((b) => t.date.startsWith(b.month));
        if (!bucket) continue;
        if (t.type === "INCOME") bucket.income += t.amount;
        else bucket.expense += t.amount;

        if (t.date.startsWith(month)) {
          if (t.type === "INCOME") monthIncome += t.amount;
          else {
            monthExpense += t.amount;
            const name = t.categoryName ?? "Tanpa kategori";
            byCategory.set(name, (byCategory.get(name) ?? 0) + t.amount);
          }
        }
      }

      return {
        month,
        totalAssets,
        monthIncome,
        monthExpense,
        recent: recent.items.map(toTransactionDto),
        expenseByCategory: [...byCategory].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        trend,
      };
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;
