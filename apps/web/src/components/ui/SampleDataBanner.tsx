import { FlaskConical } from "lucide-react";

export function SampleDataBanner() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-lg border border-dashed border-rose bg-surface px-4 py-3 text-sm text-ink-soft">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p>
        <strong className="font-semibold text-ink">Data contoh.</strong> Angka di halaman ini fiktif dan hanya untuk
        peninjauan tampilan. Belum terhubung ke database atau akun pengguna.
      </p>
    </div>
  );
}
