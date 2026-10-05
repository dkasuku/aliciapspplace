import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";
import type { Shop, Stats } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, shopId, headers } = await adminContext();
  // The login page shares this layout but has no session yet.
  if (!session) return <>{children}</>;

  let stats: Stats | null = null;
  let shops: Shop[] = [];
  [stats, shops] = await Promise.all([
    api.stats(headers).catch(() => null),
    api.shops(headers).catch(() => []),
  ]);
  // The agent trigger lives in the shell header, beside "View store".
  return (
    <AdminShell stats={stats} session={session} shops={shops} activeShopId={shopId}>
      {children}
    </AdminShell>
  );
}
