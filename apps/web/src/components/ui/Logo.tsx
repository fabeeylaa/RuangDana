/**
 * PLACEHOLDER SEMENTARA — bukan logo RuangDana resmi.
 * Tiga balok menaik sebagai pendekatan dari deskripsi logo (simbol arsitektural
 * geometris, tiga bentuk yang naik). Ganti dengan aset logo asli bila sudah tersedia.
 */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Logo RuangDana (placeholder sementara)">
      <rect width="32" height="32" rx="8" fill="#773F50" />
      <rect x="6" y="18" width="5" height="8" fill="#F7F3EF" />
      <rect x="13.5" y="13" width="5" height="13" fill="#EDE4E2" />
      <rect x="21" y="8" width="5" height="18" fill="#B8828E" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-ink">RuangDana</span>
    </div>
  );
}
