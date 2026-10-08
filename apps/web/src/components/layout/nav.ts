import { ArrowLeftRight, Landmark, LayoutDashboard, PiggyBank, Calculator, Wallet, BarChart3, User, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** tampil di navigasi bawah mobile */
  primary?: boolean;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { to: "/transaksi", label: "Transaksi", icon: ArrowLeftRight, primary: true },
  { to: "/akun", label: "Akun", icon: Landmark },
  { to: "/tabungan", label: "Tujuan Tabungan", icon: PiggyBank, primary: true },
  { to: "/perencana", label: "Perencana Tabungan", icon: Calculator },
  { to: "/anggaran", label: "Anggaran", icon: Wallet },
  { to: "/laporan", label: "Laporan", icon: BarChart3 },
  { to: "/profil", label: "Profil", icon: User },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
];
