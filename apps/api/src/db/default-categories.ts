import type { CategoryKind } from "@ruangdana/shared";

/** Kategori bawaan yang dibuat otomatis saat pengguna pertama kali membuka kategori. */
export const DEFAULT_CATEGORIES: Array<{ name: string; kind: CategoryKind }> = [
  ...["Uang Saku", "Gaji / Honor", "Beasiswa", "Hadiah", "Lainnya"].map((name) => ({ name, kind: "INCOME" as const })),
  ...["Makanan & Minuman", "Transportasi", "Pendidikan", "Hiburan", "Tagihan & Pulsa", "Belanja", "Kesehatan", "Lainnya"].map(
    (name) => ({ name, kind: "EXPENSE" as const }),
  ),
];
