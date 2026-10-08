/** Mengubah input seperti "1.500.000" atau "Rp 1500000" menjadi bilangan bulat; null bila tidak valid. */
export function parseRupiahInput(raw: string): number | null {
  const digits = raw.replace(/[\s.]|Rp/gi, "");
  if (digits === "") return 0;
  if (!/^\d{1,13}$/.test(digits)) return null;
  return Number(digits);
}
