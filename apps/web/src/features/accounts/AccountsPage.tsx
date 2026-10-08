import { useState } from "react";
import { Archive, ArchiveRestore, Banknote, Landmark, PiggyBank, Smartphone, Pencil, type LucideIcon } from "lucide-react";
import { formatRupiah, type AccountDto, type AccountType } from "@ruangdana/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AccountForm } from "./AccountForm";
import { accountTypeLabel, useAccountMutations, useAccounts } from "./accounts-api";

const icons: Record<AccountType, LucideIcon> = { CASH: Banknote, BANK: Landmark, EWALLET: Smartphone, SAVINGS: PiggyBank };

export function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: accounts, isPending, isError, error, refetch } = useAccounts(showArchived);
  const { create, update, setArchived } = useAccountMutations();

  const total = (accounts ?? []).filter((a) => !a.archived).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Akun" description="Akun yang kamu catat secara manual. Tidak terhubung ke bank mana pun." />

      <Card>
        <CardHeader title="Tambah akun" />
        <div className="p-5">
          <AccountForm submitLabel="Tambah akun" onSubmit={(input) => create.mutateAsync(input)} />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Total saldo akun aktif: <strong className="text-ink">{formatRupiah(total)}</strong></p>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="size-4 accent-primary" />
          Tampilkan akun yang diarsipkan
        </label>
      </div>

      {isPending && <p className="text-sm text-ink-soft">Memuat akun…</p>}
      {isError && (
        <Card className="p-5">
          <p role="alert" className="text-sm text-negative">{error.message}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>Coba lagi</Button>
        </Card>
      )}
      {accounts && accounts.length === 0 && (
        <Card className="px-6 py-10 text-center text-sm text-ink-soft">Belum ada akun. Tambahkan akun pertamamu di atas, mis. Tunai atau Rekening Bank.</Card>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {accounts?.map((a) => (
          <li key={a.id}>
            <AccountCard
              account={a}
              editing={editingId === a.id}
              onEdit={() => setEditingId(a.id)}
              onCancel={() => setEditingId(null)}
              onSave={async (input) => { await update.mutateAsync({ id: a.id, ...input }); setEditingId(null); }}
              onToggleArchive={() => setArchived.mutate({ id: a.id, archived: !a.archived })}
              busy={setArchived.isPending}
            />
          </li>
        ))}
      </ul>
      {setArchived.isError && <p role="alert" className="text-sm text-negative">{setArchived.error.message}</p>}

      <p className="text-xs text-ink-soft">
        Saldo = saldo awal + pemasukan − pengeluaran ± transfer. Akun hanya bisa diarsipkan saat saldonya Rp0, dan akun arsip tidak menerima transaksi baru.
        Akun diarsipkan (bukan dihapus) agar riwayat tetap terjaga.
      </p>
    </div>
  );
}

function AccountCard({ account: a, editing, onEdit, onCancel, onSave, onToggleArchive, busy }: {
  account: AccountDto;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: Parameters<typeof AccountForm>[0]["onSubmit"];
  onToggleArchive: () => void;
  busy: boolean;
}) {
  const Icon = icons[a.type];
  if (editing) {
    return (
      <Card className="p-5">
        <AccountForm initial={a} submitLabel="Simpan" onSubmit={onSave} onCancel={onCancel} />
      </Card>
    );
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-blush text-primary"><Icon className="size-5" aria-hidden /></span>
          <div>
            <h2 className="text-base font-semibold text-ink">{a.name}</h2>
            <p className="text-xs text-ink-soft">{accountTypeLabel[a.type]}</p>
          </div>
        </div>
        {a.archived && <Badge>Diarsipkan</Badge>}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-ink">{formatRupiah(a.balance)}</p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}><Pencil className="size-4" aria-hidden />Ubah</Button>
        <Button variant="ghost" size="sm" onClick={onToggleArchive} disabled={busy}>
          {a.archived ? <><ArchiveRestore className="size-4" aria-hidden />Pulihkan</> : <><Archive className="size-4" aria-hidden />Arsipkan</>}
        </Button>
      </div>
    </Card>
  );
}
