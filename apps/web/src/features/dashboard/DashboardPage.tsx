import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Landmark, PiggyBank, Wallet } from "lucide-react";
import { formatRupiah, formatRupiahCompact } from "@ruangdana/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { sampleAccounts, sampleExpenseBreakdown, sampleGoals, sampleMonthlyTrend, sampleTransactions } from "@/data/sample";
import { availableBalance, goalProgress, monthTotals, totalAssets, totalSavingsAllocation } from "@/lib/finance";
import { formatDate } from "@/lib/date";
import { StatCard } from "./StatCard";
import { TransactionAmount } from "@/features/transactions/TransactionAmount";

// Palet bertema burgundy, dibedakan lewat kecerahan + label legenda (tidak mengandalkan warna saja).
const PIE_COLORS = ["#773F50", "#B8828E", "#4A2733", "#D6B8BE", "#8F6A74"];

export function DashboardPage() {
  const { income, expense } = monthTotals(sampleTransactions, "2026-10");
  const recent = sampleTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Ringkasan keuangan Oktober 2026" />
      <SampleDataBanner />

      <section aria-label="Ringkasan saldo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Saldo tersedia" value={availableBalance(sampleAccounts, sampleGoals)} icon={Wallet} hint="Total aset dikurangi alokasi tabungan virtual" />
        <StatCard label="Total aset tercatat" value={totalAssets(sampleAccounts)} icon={Landmark} hint="Jumlah saldo semua akun" />
        <StatCard label="Total alokasi tabungan" value={totalSavingsAllocation(sampleGoals)} icon={PiggyBank} hint="Virtual + eksternal" />
        <StatCard label="Pemasukan bulan ini" value={income} icon={ArrowDownCircle} />
        <StatCard label="Pengeluaran bulan ini" value={expense} icon={ArrowUpCircle} />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Tren bulanan" />
          <div className="h-72 px-2 pb-4 pt-2 sm:px-4" role="img" aria-label="Grafik batang pemasukan dan pengeluaran per bulan, data contoh">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleMonthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0DE" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#72686B", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatRupiahCompact} tick={{ fill: "#72686B", fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Legend />
                <Bar dataKey="income" name="Pemasukan" fill="#773F50" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#B8828E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Rincian pengeluaran" />
          <div className="h-72 px-2 pb-4 pt-2" role="img" aria-label="Diagram lingkaran pengeluaran per kategori, data contoh">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sampleExpenseBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {sampleExpenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Transaksi terbaru" action={<Link to="/transaksi" className="text-sm font-medium text-primary hover:underline">Lihat semua</Link>} />
          <ul className="divide-y divide-line px-5 pb-2 pt-2">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{t.description}</p>
                  <p className="text-xs text-ink-soft">{formatDate(t.date)} · {t.category}</p>
                </div>
                <TransactionAmount type={t.type} amount={t.amount} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Progres tujuan tabungan" action={<Link to="/tabungan" className="text-sm font-medium text-primary hover:underline">Kelola</Link>} />
          <ul className="space-y-4 px-5 pb-5 pt-4">
            {sampleGoals.map((g) => {
              const pct = goalProgress(g);
              return (
                <li key={g.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-ink">{g.name}</span>
                    {pct >= 100 ? <Badge tone="positive">Tercapai</Badge> : <span className="text-ink-soft">{Math.round(pct)}%</span>}
                  </div>
                  <ProgressBar value={pct} label={`Progres ${g.name}`} />
                  <p className="mt-1 text-xs text-ink-soft">{formatRupiah(g.saved)} dari {formatRupiah(g.target)}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
