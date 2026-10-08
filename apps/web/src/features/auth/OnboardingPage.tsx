import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, PiggyBank, ShieldCheck } from "lucide-react";
import type { AuthUser } from "@ruangdana/shared";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { FormError } from "./AuthLayout";

const points = [
  { icon: Landmark, title: "Catat akun-akunmu", text: "Tunai, rekening bank, e-wallet, dan tabungan. Semua diisi manual." },
  { icon: PiggyBank, title: "Beri ruang untuk tiap tujuan", text: "Alokasikan sebagian saldo ke tujuan tabungan tanpa menghitung uang yang sama dua kali." },
  { icon: ShieldCheck, title: "Hanya pencatatan", text: "RuangDana bukan bank atau layanan pembayaran. Tidak ada uang nyata yang dipindahkan." },
];

export function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true); setError(null);
    try {
      setUser((await api<{ user: AuthUser }>("/profile/onboarded", { method: "POST" })).user);
      navigate("/akun", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo />
      <Card className="mt-8 w-full max-w-xl p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Selamat datang, {user?.name.split(" ")[0]}!</h1>
        <p className="mt-1 text-sm text-ink-soft">Beri Ruang untuk Setiap Tujuan.</p>
        <ul className="mt-6 space-y-5">
          {points.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-blush text-primary"><Icon className="size-5" aria-hidden /></span>
              <div>
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
                <p className="text-sm text-ink-soft">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3">
          <FormError message={error} />
          <Button className="w-full" onClick={start} disabled={busy}>{busy ? "Memproses…" : "Mulai dengan menambahkan akun"}</Button>
        </div>
      </Card>
    </main>
  );
}
