import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { sampleAccounts, sampleTransactions } from "@/data/sample";
import { TransactionAmount } from "./TransactionAmount";

const typeLabel = { INCOME: "Pemasukan", EXPENSE: "Pengeluaran", TRANSFER: "Transfer" } as const;
const typeTone = { INCOME: "positive", EXPENSE: "negative", TRANSFER: "neutral" } as const;

export function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [accountId, setAccountId] = useState("");

  const accountName = (id?: string) => sampleAccounts.find((a) => a.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sampleTransactions.filter(
      (t) =>
        (!q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) &&
        (!type || t.type === type) &&
        (!accountId || t.accountId === accountId || t.toAccountId === accountId),
    );
  }, [query, type, accountId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi"
        description="Riwayat pemasukan, pengeluaran, dan transfer antar akun"
        action={<Button disabled title="Tersedia di Phase 3"><Plus className="size-4" aria-hidden />Tambah transaksi</Button>}
      />
      <SampleDataBanner />

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative">
            <TextInput label="Cari" placeholder="Deskripsi atau kategori" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            <Search className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-ink-soft" aria-hidden />
          </div>
          <Select label="Jenis" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Semua jenis</option>
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
            <option value="TRANSFER">Transfer</option>
          </Select>
          <Select label="Akun" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Semua akun</option>
            {sampleAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">Tidak ada transaksi yang cocok dengan filter.</p>
        ) : (
          <>
            {/* Tabel untuk layar lebar */}
            <table className="hidden w-full text-left text-sm md:table">
              <caption className="sr-only">Daftar transaksi contoh</caption>
              <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Tanggal</th>
                  <th scope="col" className="px-5 py-3 font-medium">Deskripsi</th>
                  <th scope="col" className="px-5 py-3 font-medium">Kategori</th>
                  <th scope="col" className="px-5 py-3 font-medium">Akun</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-ink-soft">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 font-medium text-ink">{t.description}</td>
                    <td className="px-5 py-3"><Badge tone={typeTone[t.type]}>{t.type === "TRANSFER" ? "Transfer" : t.category}</Badge></td>
                    <td className="px-5 py-3 text-ink-soft">{t.type === "TRANSFER" ? `${accountName(t.accountId)} → ${accountName(t.toAccountId)}` : accountName(t.accountId)}</td>
                    <td className="px-5 py-3 text-right"><TransactionAmount type={t.type} amount={t.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Daftar kartu untuk mobile */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.description}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{formatDate(t.date)} · {accountName(t.accountId)}</p>
                    <div className="mt-1.5"><Badge tone={typeTone[t.type]}>{typeLabel[t.type]}{t.type !== "TRANSFER" ? ` · ${t.category}` : ""}</Badge></div>
                  </div>
                  <TransactionAmount type={t.type} amount={t.amount} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
