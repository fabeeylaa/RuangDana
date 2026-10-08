import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { TransactionDto } from "@ruangdana/shared";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { useAccounts } from "@/features/accounts/accounts-api";
import { TransactionAmount } from "./TransactionAmount";
import { TransactionForm } from "./TransactionForm";
import { PAGE_SIZE, typeLabel, useCategories, useTransactionMutations, useTransactions, type TransactionFilters } from "./transactions-api";

const typeTone = { INCOME: "positive", EXPENSE: "negative", TRANSFER: "neutral" } as const;
const emptyFilters: TransactionFilters = { search: "", type: "", accountId: "", dateFrom: "", dateTo: "", page: 1 };

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [mode, setMode] = useState<{ kind: "none" } | { kind: "create" } | { kind: "edit"; tx: TransactionDto }>({ kind: "none" });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTransactions(filters);
  const { create, update, remove } = useTransactionMutations();

  const set = (patch: Partial<TransactionFilters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const hasFilter = Boolean(filters.search || filters.type || filters.accountId || filters.dateFrom || filters.dateTo);
  const noAccounts = accounts !== undefined && accounts.filter((a) => !a.archived).length === 0;
  const rows = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi"
        description="Riwayat pemasukan, pengeluaran, dan transfer antar akun"
        action={mode.kind === "none" && <Button onClick={() => setMode({ kind: "create" })} disabled={noAccounts}><Plus className="size-4" aria-hidden />Tambah transaksi</Button>}
      />
      {noAccounts && <Card className="p-4 text-sm text-ink-soft">Buat minimal satu akun di halaman Akun sebelum mencatat transaksi.</Card>}

      {mode.kind !== "none" && accounts && (
        <Card>
          <CardHeader title={mode.kind === "create" ? "Transaksi baru" : "Ubah transaksi"} />
          <div className="p-5">
            <TransactionForm
              key={mode.kind === "edit" ? mode.tx.id : "new"}
              initial={mode.kind === "edit" ? mode.tx : undefined}
              accounts={accounts}
              categories={categories}
              onCancel={() => setMode({ kind: "none" })}
              onSubmit={async (input) => {
                if (mode.kind === "edit") {
                  const { type: _type, ...rest } = input;
                  await update.mutateAsync({ id: mode.tx.id, ...rest });
                } else {
                  await create.mutateAsync(input);
                }
                setMode({ kind: "none" });
              }}
            />
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <TextInput label="Cari deskripsi" placeholder="mis. kopi" value={filters.search} onChange={(e) => set({ search: e.target.value })} className="pl-9" />
            <Search className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-ink-soft" aria-hidden />
          </div>
          <Select label="Jenis" value={filters.type} onChange={(e) => set({ type: e.target.value as TransactionFilters["type"] })}>
            <option value="">Semua jenis</option>
            {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select label="Akun" value={filters.accountId} onChange={(e) => set({ accountId: e.target.value })}>
            <option value="">Semua akun</option>
            {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}{a.archived ? " (arsip)" : ""}</option>)}
          </Select>
          <TextInput label="Dari tanggal" type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
          <TextInput label="Sampai tanggal" type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
        </div>
        {hasFilter && <Button variant="ghost" size="sm" className="mt-3" onClick={() => setFilters(emptyFilters)}>Reset filter</Button>}
      </Card>

      {isError && (
        <Card className="p-5">
          <p role="alert" className="text-sm text-negative">{error.message}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>Coba lagi</Button>
        </Card>
      )}
      {remove.isError && <p role="alert" className="text-sm text-negative">{remove.error.message}</p>}

      <Card className="overflow-hidden">
        {isPending ? (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">Memuat transaksi…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            {hasFilter ? "Tidak ada transaksi yang cocok dengan filter." : "Belum ada transaksi. Catat pemasukan atau pengeluaran pertamamu."}
          </p>
        ) : (
          <div className={isPlaceholderData ? "opacity-60" : undefined}>
            <table className="hidden w-full text-left text-sm md:table">
              <caption className="sr-only">Daftar transaksi</caption>
              <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Tanggal</th>
                  <th scope="col" className="px-5 py-3 font-medium">Deskripsi</th>
                  <th scope="col" className="px-5 py-3 font-medium">Kategori</th>
                  <th scope="col" className="px-5 py-3 font-medium">Akun</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Jumlah</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-ink-soft">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 font-medium text-ink">{t.description || <span className="text-ink-soft">—</span>}</td>
                    <td className="px-5 py-3"><Badge tone={typeTone[t.type]}>{t.type === "TRANSFER" ? "Transfer" : t.categoryName ?? "—"}</Badge></td>
                    <td className="px-5 py-3 text-ink-soft">{t.type === "TRANSFER" ? `${t.accountName} → ${t.toAccountName}` : t.accountName}</td>
                    <td className="px-5 py-3 text-right"><TransactionAmount type={t.type} amount={t.amount} /></td>
                    <td className="px-5 py-3"><RowActions t={t} confirming={confirmId === t.id} onEdit={() => setMode({ kind: "edit", tx: t })} onAsk={() => setConfirmId(t.id)} onCancel={() => setConfirmId(null)} onDelete={() => remove.mutate(t.id, { onSettled: () => setConfirmId(null) })} busy={remove.isPending} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((t) => (
                <li key={t.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{t.description || typeLabel[t.type]}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{formatDate(t.date)} · {t.type === "TRANSFER" ? `${t.accountName} → ${t.toAccountName}` : t.accountName}</p>
                      <div className="mt-1.5"><Badge tone={typeTone[t.type]}>{typeLabel[t.type]}{t.categoryName ? ` · ${t.categoryName}` : ""}</Badge></div>
                    </div>
                    <TransactionAmount type={t.type} amount={t.amount} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <RowActions t={t} confirming={confirmId === t.id} onEdit={() => setMode({ kind: "edit", tx: t })} onAsk={() => setConfirmId(t.id)} onCancel={() => setConfirmId(null)} onDelete={() => remove.mutate(t.id, { onSettled: () => setConfirmId(null) })} busy={remove.isPending} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {data && data.total > 0 && (
        <nav aria-label="Halaman" className="flex items-center justify-between text-sm text-ink-soft">
          <p>{data.total} transaksi · halaman {data.page} dari {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}><ChevronLeft className="size-4" aria-hidden />Sebelumnya</Button>
            <Button variant="secondary" size="sm" disabled={filters.page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Berikutnya<ChevronRight className="size-4" aria-hidden /></Button>
          </div>
        </nav>
      )}
    </div>
  );
}

function RowActions({ t, confirming, onEdit, onAsk, onCancel, onDelete, busy }: {
  t: TransactionDto; confirming: boolean; onEdit: () => void; onAsk: () => void; onCancel: () => void; onDelete: () => void; busy: boolean;
}) {
  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-ink-soft">Hapus transaksi ini?</span>
        <Button size="sm" variant="secondary" onClick={onDelete} disabled={busy}>Ya, hapus</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Batal</Button>
      </div>
    );
  }
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Ubah transaksi ${t.description || typeLabel[t.type]}`}><Pencil className="size-4" aria-hidden /></Button>
      <Button size="sm" variant="ghost" onClick={onAsk} aria-label={`Hapus transaksi ${t.description || typeLabel[t.type]}`}><Trash2 className="size-4" aria-hidden /></Button>
    </div>
  );
}
