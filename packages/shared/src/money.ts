/**
 * Semua nilai uang disimpan sebagai bilangan bulat Rupiah (tanpa desimal).
 * IDR tidak memakai sen dalam praktik sehari-hari, jadi integer aman
 * dan menghindari galat pembulatan floating point.
 */
export type Rupiah = number;

export function isSafeRupiah(value: unknown): value is Rupiah {
  return typeof value === "number" && Number.isSafeInteger(value);
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: Rupiah): string {
  return idrFormatter.format(value).replace(/ /g, " ");
}

/** Format ringkas untuk sumbu grafik, mis. 1,5 jt */
export function formatRupiahCompact(value: Rupiah): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)} rb`;
  return `${sign}${abs}`;
}

/** Batas atas nilai uang per entri agar penjumlahan tetap aman sebagai integer JS. */
export const MAX_RUPIAH = 1_000_000_000_000; // 1 triliun

/** Batas atas saldo satu akun (jauh di bawah Number.MAX_SAFE_INTEGER ≈ 9×10^15). */
export const MAX_BALANCE = 1_000_000_000_000_000; // 1 kuadriliun
