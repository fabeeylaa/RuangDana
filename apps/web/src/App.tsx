import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { OnboardingPage } from "@/features/auth/OnboardingPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { GuestOnly, RequireAuth } from "@/features/auth/RouteGuards";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ComingSoonPage } from "@/features/placeholders/ComingSoonPage";
import { SettingsPage } from "@/features/placeholders/SettingsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { SavingsGoalsPage } from "@/features/savings/SavingsGoalsPage";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";

export function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="masuk" element={<LoginPage />} />
        <Route path="daftar" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth allowUnonboarded />}>
        <Route path="selamat-datang" element={<OnboardingPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="transaksi" element={<TransactionsPage />} />
          <Route path="tabungan" element={<SavingsGoalsPage />} />
          <Route path="akun" element={<AccountsPage />} />
          <Route path="perencana" element={<ComingSoonPage title="Perencana Tabungan" phase="Phase 5" />} />
          <Route path="anggaran" element={<ComingSoonPage title="Anggaran" phase="Phase 6" />} />
          <Route path="laporan" element={<ComingSoonPage title="Laporan" phase="Phase 6" />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
          <Route path="*" element={<ComingSoonPage title="Halaman tidak ditemukan" phase="—" />} />
        </Route>
      </Route>
    </Routes>
  );
}
