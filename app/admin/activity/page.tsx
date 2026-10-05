import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { ActivityFeed } from "@/components/admin/activity-feed";
import type { ActivityEntry, Shop, StaffSummary, StaffUser } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const { headers, shopId } = await adminContext();
  const params: Record<string, string> = shopId ? { shop_id: shopId } : {};
  let entries: ActivityEntry[] = [];
  let shops: Shop[] = [];
  let users: StaffUser[] = [];
  let summary: StaffSummary[] = [];
  try {
    [entries, shops, users, summary] = await Promise.all([
      api.activity(params),
      api.shops(headers),
      api.users(headers),
      api.staffSummary(headers),
    ]);
  } catch {}
  if (shopId) summary = summary.filter((row) => row.shop_id === shopId);
  return <ActivityFeed initialEntries={entries} shops={shops} users={users} summary={summary} />;
}
