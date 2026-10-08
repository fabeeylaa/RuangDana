import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MAX_RUPIAH, type AccountDto, type CategoryDto, type TransactionDto, type TransactionType } from "@ruangdana/shared";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { FormError } from "@/features/auth/AuthLayout";
import { applyApiError } from "@/lib/form-errors";
import { parseRupiahInput } from "@/lib/rupiah-input";
import { categoriesOfKind, typeLabel, type TransactionInput } from "./transactions-api";

const schema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    amount: z.string().refine((v) => {
      const n = parseRupiahInput(v);
      return n !== null && n >= 1 && n <= MAX_RUPIAH;
    }, "Isi dengan angka bulat Rupiah lebih dari 0, tanpa desimal."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi."),
    description: z.string().trim().max(200, "Deskripsi maksimal 200 karakter."),
    accountId: z.string().min(1, "Pilih akun."),
    toAccountId: z.string(),
    categoryId: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "TRANSFER") {
      if (!v.toAccountId) ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pilih akun tujuan." });
      else if (v.toAccountId === v.accountId) ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Akun tujuan harus berbeda dari akun asal." });
    } else if (!v.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Pilih kategori." });
    }
  });
type Values = z.infer<typeof schema>;

export const todayIso = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function TransactionForm({
  initial, accounts, categories, onSubmit, onCancel,
}: {
  initial?: TransactionDto;
  accounts: AccountDto[];
  categories: CategoryDto[] | undefined;
  onSubmit: (input: TransactionInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, control, setError, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initial?.type ?? "EXPENSE",
      amount: initial ? String(initial.amount) : "",
      date: initial?.date ?? todayIso(),
      description: initial?.description ?? "",
      accountId: initial?.accountId ?? "",
      toAccountId: initial?.toAccountId ?? "",
      categoryId: initial?.categoryId ?? "",
    },
  });
  const type = useWatch({ control, name: "type" }) as TransactionType;
  const editing = Boolean(initial);
  // Akun yang diarsipkan membeku, jadi tidak ditawarkan (kecuali akun asli transaksi yang sedang diedit).
  const usable = accounts.filter((a) => !a.archived || a.id === initial?.accountId || a.id === initial?.toAccountId);

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    const input: TransactionInput = {
      type: v.type,
      amount: parseRupiahInput(v.amount) ?? 0,
      date: v.date,
      description: v.description,
      accountId: v.accountId,
      ...(v.type === "TRANSFER" ? { toAccountId: v.toAccountId } : { categoryId: v.categoryId }),
    };
    try {
      await onSubmit(input);
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Jenis" disabled={editing} hint={editing ? "Jenis tidak bisa diubah. Hapus lalu buat ulang bila salah." : undefined}
          {...register("type", { onChange: () => setValue("categoryId", "") })}
        >
          {(Object.keys(typeLabel) as TransactionType[]).map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
        </Select>
        <TextInput label="Jumlah (Rp)" inputMode="numeric" placeholder="mis. 25000" error={errors.amount?.message} {...register("amount")} />
        <TextInput label="Tanggal" type="date" error={errors.date?.message} {...register("date")} />
        <Select label={type === "TRANSFER" ? "Dari akun" : "Akun"} error={errors.accountId?.message} {...register("accountId")}>
          <option value="">Pilih akun</option>
          {usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        {type === "TRANSFER" ? (
          <Select label="Ke akun" error={errors.toAccountId?.message} {...register("toAccountId")}>
            <option value="">Pilih akun tujuan</option>
            {usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        ) : (
          <Select label="Kategori" error={errors.categoryId?.message} {...register("categoryId")}>
            <option value="">Pilih kategori</option>
            {categoriesOfKind(categories, type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <TextInput label="Deskripsi (opsional)" placeholder="mis. Makan siang" error={errors.description?.message} {...register("description")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan transaksi"}</Button>
        <Button variant="secondary" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  );
}
