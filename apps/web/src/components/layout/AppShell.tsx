import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { navItems } from "./nav";

function SidebarLink({ to, label, icon: Icon, onNavigate }: (typeof navItems)[number] & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive ? "bg-primary text-white" : "text-ink-soft hover:bg-blush hover:text-ink",
        )
      }
    >
      <Icon className="size-[18px]" aria-hidden />
      {label}
    </NavLink>
  );
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const primary = navItems.filter((n) => n.primary);

  return (
    <div className="min-h-screen">
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
        Lewati ke konten utama
      </a>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2"><Logo /></div>
        <nav aria-label="Navigasi utama" className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => <SidebarLink key={item.to} {...item} />)}
        </nav>
        <p className="px-2 text-xs text-ink-soft">Beri Ruang untuk Setiap Tujuan.</p>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo />
        <button
          type="button"
          aria-label="Buka menu lengkap"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-lg text-ink-soft hover:bg-blush"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </header>

      {/* Drawer mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu lengkap">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-surface p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Menu</span>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-lg text-ink-soft hover:bg-blush"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="Navigasi lengkap" className="mt-3 flex flex-col gap-1 overflow-y-auto">
              {navItems.map((item) => <SidebarLink key={item.to} {...item} onNavigate={() => setMenuOpen(false)} />)}
            </nav>
          </div>
        </div>
      )}

      <main id="konten" className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Navigasi bawah mobile */}
      <nav aria-label="Navigasi cepat" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden">
        <ul className="grid grid-cols-4">
          {primary.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", isActive ? "text-primary" : "text-ink-soft")
                }
              >
                <Icon className="size-5" aria-hidden />
                {label === "Tujuan Tabungan" ? "Tabungan" : label}
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setMenuOpen(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-soft">
              <Menu className="size-5" aria-hidden />
              Lainnya
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
