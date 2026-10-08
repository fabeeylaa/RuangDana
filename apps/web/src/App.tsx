import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { SavingsGoalsPage } from "@/features/savings/SavingsGoalsPage";
import { ComingSoonPage } from "@/features/placeholders/ComingSoonPage";
import { SettingsPage } from "@/features/placeholders/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="transaksi" element={<TransactionsPage />} />
        <Route path="tabungan" element={<SavingsGoalsPage />} />
        <Route path="akun" element={<ComingSoonPage title="Akun" phase="Phase 2" />} />
        <Route path="perencana" element={<ComingSoonPage title="Perencana Tabungan" phase="Phase 5" />} />
        <Route path="anggaran" element={<ComingSoonPage title="Anggaran" phase="Phase 6" />} />
        <Route path="laporan" element={<ComingSoonPage title="Laporan" phase="Phase 6" />} />
        <Route path="profil" element={<ComingSoonPage title="Profil" phase="Phase 2" />} />
        <Route path="pengaturan" element={<SettingsPage />} />
        <Route path="*" element={<ComingSoonPage title="Halaman tidak ditemukan" phase="—" />} />
      </Route>
    </Routes>
  );
}
