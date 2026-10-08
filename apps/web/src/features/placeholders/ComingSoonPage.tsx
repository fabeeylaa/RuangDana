import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export function ComingSoonPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-blush text-primary">
          <Hammer className="size-5" aria-hidden />
        </span>
        <h2 className="text-base font-semibold text-ink">Halaman ini belum dibangun</h2>
        <p className="max-w-sm text-sm text-ink-soft">Dijadwalkan pada {phase}. Phase 1 hanya mencakup fondasi proyek, Dashboard, Transaksi, dan Tujuan Tabungan.</p>
      </Card>
    </div>
  );
}
