import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "./AuthContext";

function FullScreenMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      {children}
    </div>
  );
}

/** Halaman yang butuh login. Pengguna baru diarahkan ke onboarding lebih dulu. */
export function RequireAuth({ allowUnonboarded = false }: { allowUnonboarded?: boolean }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenMessage title="Memuat…" />;
  if (error) {
    return (
      <FullScreenMessage title="Server tidak dapat dihubungi">
        <p className="max-w-sm text-sm text-ink-soft">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Coba lagi</Button>
      </FullScreenMessage>
    );
  }
  if (!user) return <Navigate to="/masuk" replace state={{ from: location.pathname }} />;
  if (!user.onboarded && !allowUnonboarded) return <Navigate to="/selamat-datang" replace />;
  return <Outlet />;
}

/** Halaman tamu (masuk/daftar): pengguna yang sudah login diarahkan ke dashboard. */
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenMessage title="Memuat…" />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
