import { api } from "@/lib/api";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let stats = null;
  try {
    stats = await api.stats();
  } catch {}
  // The agent trigger lives in the shell header, beside "View store".
  return <AdminShell stats={stats}>{children}</AdminShell>;
}
