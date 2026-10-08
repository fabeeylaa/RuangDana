import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@ruangdana/shared";
import { api, ApiError } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** Galat jaringan/server saat memeriksa sesi (bukan sekadar "belum login"). */
  error: ApiError | null;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  register: (input: { name: string; email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const Ctx = createContext<AuthState | null>(null);
const ME_KEY = ["me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return (await api<{ user: AuthUser }>("/auth/me")).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const setUser = (user: AuthUser | null) => qc.setQueryData(ME_KEY, user);

  const loginM = useMutation({
    mutationFn: (input: { email: string; password: string }) => api<{ user: AuthUser }>("/auth/login", { method: "POST", body: input }),
    onSuccess: ({ user }) => { qc.clear(); setUser(user); },
  });
  const registerM = useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) => api<{ user: AuthUser }>("/auth/register", { method: "POST", body: input }),
    onSuccess: ({ user }) => { qc.clear(); setUser(user); },
  });
  const logoutM = useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    // Hapus semua cache agar data pengguna sebelumnya tidak tersisa di perangkat bersama.
    onSettled: () => { qc.clear(); setUser(null); },
  });

  const value: AuthState = {
    user: me.data ?? null,
    loading: me.isPending,
    error: me.error instanceof ApiError ? me.error : null,
    login: async (i) => (await loginM.mutateAsync(i)).user,
    register: async (i) => (await registerM.mutateAsync(i)).user,
    logout: () => logoutM.mutateAsync().catch(() => undefined),
    setUser,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return v;
}
