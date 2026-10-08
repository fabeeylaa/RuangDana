import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Landmark } from "lucide-react";
import { formatRupiah, formatRupiahCompact } from "@ruangdana/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge as SampleBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { sampleGoals } from "@/data/sample";
import { goalProgress } from "@/lib/finance";
import { useDashboard } from "@/features/transactions/transactions-api";
import { formatDate } from "@/lib/date";
import { StatCard } from "./StatCard";
import { TransactionAmount } from "@/features/transactions/TransactionAmount";

// Palet bertema burgundy, dibedakan lewat kecerahan + label legenda (tidak mengandalkan warna saja).
const PIE_COLORS = ["#773F50", "#B8828E", "#4A2733", "#D6B8BE", "#8F6A74"];

const monthFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const shortMonthFmt = new Intl.DateTimeFormat("id-ID", { month: "short" });
const monthLabel = (ym: string, fmt: Intl.DateTimeFormat) => fmt.format(new Date(`${ym}-01T00:00:00`));

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useDashboard();

  if (isPending) return <p className="text-sm text-ink-soft">Memuat dasbor…</p>;
  if (isError) {
    return (
      <Card className="p-5">
        <p role="alert" className="text-sm text-negative">{error.message}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>Coba lagi</Button>
      </Card>
    );
  }

  const trend = data.trend.map((t) => ({ ...t, label: monthLabel(t.month, shortMonthFmt) }));
  const hasExpense = data.expenseByCategory.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Ringkasan keuangan ${monthLabel(data.month, monthFmt)}`} />

      <section aria-label="Ringkasan saldo" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total aset tercatat" value={data.totalAssets} icon={Landmark} hint="Jumlah saldo semua akun aktif. Transfer antar akun tidak mengubahnya." />
        <StatCard label="Pemasukan bulan ini" value={data.monthIncome} icon={ArrowDownCircle} />
        <StatCard label="Pengeluaran bulan ini" value={data.monthExpense} icon={ArrowUpCircle} />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Tren bulanan" />
          <div className="h-72 px-2 pb-4 pt-2 sm:px-4" role="img" aria-label="Grafik batang pemasukan dan pengeluaran 6 bulan terakhir">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0DE" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#72686B", fontSize: 12 }} axisLine={false} tickLine={false} />
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
          {hasExpense ? (
            <div className="h-72 px-2 pb-4 pt-2" role="img" aria-label="Diagram lingkaran pengeluaran bulan ini per kategori">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.expenseByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {data.expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-ink-soft">Belum ada pengeluaran bulan ini.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Transaksi terbaru" action={<Link to="/transaksi" className="text-sm font-medium text-primary hover:underline">Lihat semua</Link>} />
          {data.recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-line px-5 pb-2 pt-2">
              {data.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.description || (t.type === "TRANSFER" ? "Transfer" : t.categoryName)}</p>
                    <p className="text-xs text-ink-soft">{formatDate(t.date)} · {t.type === "TRANSFER" ? `${t.accountName} → ${t.toAccountName}` : t.categoryName}</p>
                  </div>
                  <TransactionAmount type={t.type} amount={t.amount} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Progres tujuan tabungan (contoh)" action={<Link to="/tabungan" className="text-sm font-medium text-primary hover:underline">Kelola</Link>} />
          <p className="px-5 pt-3 text-xs text-ink-soft"><SampleBadge tone="sample">Data contoh</SampleBadge> Tujuan tabungan nyata hadir di Phase 4.</p>
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
