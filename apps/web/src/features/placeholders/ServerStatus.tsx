import { useQuery } from "@tanstack/react-query";
import type { HealthResponse } from "@ruangdana/shared";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Dipakai di halaman Pengaturan untuk memeriksa koneksi ke backend. */
export function ServerStatus() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({ queryKey: ["health"], queryFn: fetchHealth, retry: false });
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Status server API</h2>
        {isPending ? <Badge>Memeriksa…</Badge> : isError ? <Badge tone="negative">Tidak terhubung</Badge> : <Badge tone="positive">Terhubung</Badge>}
      </div>
      {data && <p className="mt-2 text-sm text-ink-soft">{data.service} v{data.version} · aktif {data.uptimeSeconds} detik</p>}
      {isError && <p className="mt-2 text-sm text-ink-soft">Pastikan backend berjalan (<code>npm run dev</code> dari root proyek).</p>}
      <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-3 text-sm font-medium text-primary hover:underline disabled:opacity-50">
        Periksa ulang
      </button>
    </Card>
  );
}
