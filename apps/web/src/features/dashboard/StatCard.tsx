import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@ruangdana/shared";

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: number; icon: LucideIcon; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{label}</p>
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blush text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{formatRupiah(value)}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </Card>
  );
}
