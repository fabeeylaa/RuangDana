import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { applyApiError } from "@/lib/form-errors";
import { AuthLayout, FormError } from "./AuthLayout";
import { useAuth } from "./AuthContext";
import { loginSchema, type LoginValues } from "./schemas";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  });

  return (
    <AuthLayout
      title="Masuk ke RuangDana"
      subtitle="Lanjutkan mengatur ruang untuk setiap tujuanmu."
      footer={<>Belum punya akun? <Link to="/daftar" className="font-medium text-primary hover:underline">Daftar</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <TextInput label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <TextInput label="Kata sandi" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Memproses…" : "Masuk"}</Button>
      </form>
    </AuthLayout>
  );
}
