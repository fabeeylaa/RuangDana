import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo />
      <Card className="mt-8 w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
      <p className="mt-6 text-sm text-ink-soft">{footer}</p>
    </main>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-negative/30 bg-[#f6e3e3] px-3 py-2 text-sm text-negative">{message}</p>;
}
