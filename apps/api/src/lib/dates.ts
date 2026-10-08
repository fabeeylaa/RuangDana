/** Memeriksa string yyyy-mm-dd yang benar-benar ada di kalender (menolak mis. 2026-02-30). */
export function isRealDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function isYearMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Bulan ke-`offset` dari `yyyy-mm` (offset boleh negatif). */
export function shiftMonth(yearMonth: string, offset: number): string {
  const [y, m] = yearMonth.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + offset;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}

export function monthStart(yearMonth: string): string {
  return `${yearMonth}-01`;
}

export function monthEnd(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number) as [number, number];
  return `${yearMonth}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`;
}

export function currentYearMonth(now = new Date()): string {
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`;
}
