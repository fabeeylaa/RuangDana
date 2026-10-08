import type { TransactionType } from "@ruangdana/shared";
import { formatRupiah } from "@ruangdana/shared";
import { cn } from "@/lib/cn";

/** Tanda +/− disertakan agar arah transaksi tidak hanya dibedakan oleh warna. */
export function TransactionAmount({ type, amount }: { type: TransactionType; amount: number }) {
  const sign = type === "INCOME" ? "+" : type === "EXPENSE" ? "−" : "";
  return (
    <span className={cn("shrink-0 text-sm font-semibold tabular-nums", type === "INCOME" && "text-positive", type === "EXPENSE" && "text-negative", type === "TRANSFER" && "text-ink-soft")}>
      {sign}{formatRupiah(amount)}
    </span>
  );
}
