import { CalendarDays, Plus } from "lucide-react";
import { formatRupiah } from "@ruangdana/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { sampleGoals } from "@/data/sample";
import { goalProgress } from "@/lib/finance";
import { formatDate } from "@/lib/date";

const methodLabel = { VIRTUAL: "Tabungan virtual", EXTERNAL: "Tabungan eksternal" } as const;
const methodHelp = {
  VIRTUAL: "Dana tetap di akun, dicadangkan untuk tujuan ini.",
  EXTERNAL: "Dicatat saja; tidak ada transfer uang nyata.",
} as const;

export function SavingsGoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tujuan Tabungan"
        description="Beri ruang untuk setiap tujuan keuanganmu"
        action={<Button disabled title="Tersedia di Phase 4"><Plus className="size-4" aria-hidden />Tujuan baru</Button>}
      />
      <SampleDataBanner />

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sampleGoals.map((g) => {
          const pct = goalProgress(g);
          const done = pct >= 100;
          return (
            <li key={g.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-ink">{g.name}</h2>
                  {done ? <Badge tone="positive">Tercapai</Badge> : <Badge>Berjalan</Badge>}
                </div>
                <div className="mt-1"><Badge tone="brand">{methodLabel[g.method]}</Badge></div>
                <p className="mt-2 text-xs text-ink-soft">{methodHelp[g.method]}</p>

                <p className="mt-5 text-2xl font-semibold tracking-tight text-ink">{formatRupiah(g.saved)}</p>
                <p className="text-sm text-ink-soft">dari target {formatRupiah(g.target)}</p>

                <div className="mt-4"><ProgressBar value={pct} label={`Progres ${g.name}`} /></div>
                <p className="mt-1.5 text-xs text-ink-soft">{Math.round(pct)}% tercapai</p>

                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-ink-soft">
                  <CalendarDays className="size-3.5" aria-hidden />
                  Target: {formatDate(g.targetDate)}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-ink-soft">
        Detail tujuan, setoran/penarikan, dan riwayat tabungan akan dibangun di Phase 4. Perhitungan di sini hanya contoh tampilan.
      </p>
    </div>
  );
}
