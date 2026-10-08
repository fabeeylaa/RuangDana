import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { applyApiError } from "@/lib/form-errors";
import { AuthLayout, FormError } from "./AuthLayout";
import { useAuth } from "./AuthContext";
import { registerSchema, type RegisterValues } from "./schemas";

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signUp(values);
      navigate("/selamat-datang", { replace: true });
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  });

  return (
    <AuthLayout
      title="Buat akun RuangDana"
      subtitle="Catat keuanganmu secara manual. Tidak ada koneksi ke bank dan tidak ada uang nyata yang dipindahkan."
      footer={<>Sudah punya akun? <Link to="/masuk" className="font-medium text-primary hover:underline">Masuk</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <TextInput label="Nama" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <TextInput label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <TextInput label="Kata sandi" type="password" autoComplete="new-password" hint="Minimal 8 karakter." error={errors.password?.message} {...register("password")} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Memproses…" : "Daftar"}</Button>
      </form>
    </AuthLayout>
  );
}
