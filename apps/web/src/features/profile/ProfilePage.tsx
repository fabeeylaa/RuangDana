import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AuthUser } from "@ruangdana/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { FormError } from "@/features/auth/AuthLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";
import { applyApiError } from "@/lib/form-errors";

const nameSchema = z.object({ name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter.") });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter.").max(128, "Kata sandi maksimal 128 karakter."),
});

export function ProfilePage() {
  const { user, setUser } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <PageHeader title="Profil" description={user.email} />
      <NameCard user={user} onSaved={setUser} />
      <PasswordCard />
    </div>
  );
}

function NameCard({ user, onSaved }: { user: AuthUser; onSaved: (u: AuthUser) => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(nameSchema), defaultValues: { name: user.name } });
  const submit = handleSubmit(async (v) => {
    setFormError(null); setSaved(false);
    try {
      onSaved((await api<{ user: AuthUser }>("/profile", { method: "PATCH", body: v })).user);
      setSaved(true);
    } catch (err) { setFormError(applyApiError(err, setError)); }
  });
  return (
    <Card>
      <CardHeader title="Data diri" />
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <FormError message={formError} />
        <TextInput label="Nama" error={errors.name?.message} {...register("name")} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan…" : "Simpan"}</Button>
          {saved && <span role="status" className="text-sm text-positive">Tersimpan.</span>}
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(passwordSchema) });
  const submit = handleSubmit(async (v) => {
    setFormError(null); setSaved(false);
    try {
      await api<void>("/profile/password", { method: "POST", body: v });
      reset(); setSaved(true);
    } catch (err) { setFormError(applyApiError(err, setError)); }
  });
  return (
    <Card>
      <CardHeader title="Ganti kata sandi" />
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <FormError message={formError} />
        <TextInput label="Kata sandi saat ini" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <TextInput label="Kata sandi baru" type="password" autoComplete="new-password" hint="Perangkat lain akan keluar otomatis setelah kata sandi diganti." error={errors.newPassword?.message} {...register("newPassword")} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan…" : "Ganti kata sandi"}</Button>
          {saved && <span role="status" className="text-sm text-positive">Kata sandi diganti.</span>}
        </div>
      </form>
    </Card>
  );
}
