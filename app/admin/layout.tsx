import { api } from "@/lib/api";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminAgentPanel } from "@/components/admin/admin-agent-panel";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let stats = null;
  try {
    stats = await api.stats();
  } catch {}
  return <AdminShell stats={stats}>{children}<AdminAgentPanel /></AdminShell>;
}
