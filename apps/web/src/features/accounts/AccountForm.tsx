import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MAX_RUPIAH, type AccountDto } from "@ruangdana/shared";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { FormError } from "@/features/auth/AuthLayout";
import { applyApiError } from "@/lib/form-errors";
import { parseRupiahInput } from "@/lib/rupiah-input";
import { accountTypeLabel, type AccountInput } from "./accounts-api";

const schema = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi.").max(60, "Nama akun maksimal 60 karakter."),
  type: z.enum(["CASH", "BANK", "EWALLET", "SAVINGS"]),
  openingBalance: z.string().refine((v) => {
    const n = parseRupiahInput(v);
    return n !== null && n <= MAX_RUPIAH;
  }, "Isi dengan angka bulat Rupiah tanpa desimal, mis. 1500000."),
});
type Values = z.infer<typeof schema>;

export function AccountForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial?: AccountDto;
  submitLabel: string;
  onSubmit: (input: AccountInput) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: initial?.name ?? "", type: initial?.type ?? "BANK", openingBalance: String(initial?.openingBalance ?? 0) },
  });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await onSubmit({ name: v.name, type: v.type, openingBalance: parseRupiahInput(v.openingBalance) ?? 0 });
      if (!initial) reset();
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput label="Nama akun" placeholder="mis. Rekening Utama" error={errors.name?.message} {...register("name")} />
        <Select label="Jenis" error={errors.type?.message} {...register("type")}>
          {Object.entries(accountTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <TextInput label="Saldo awal (Rp)" inputMode="numeric" error={errors.openingBalance?.message} {...register("openingBalance")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan…" : submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Batal</Button>}
      </div>
    </form>
  );
}
