import { PageHeader } from "@/components/ui/PageHeader";
import { ServerStatus } from "./ServerStatus";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Preferensi aplikasi akan tersedia di fase berikutnya." />
      <ServerStatus />
    </div>
  );
}
