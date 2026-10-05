import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { UsersManager } from "@/components/admin/users-manager";
import type { Shop, StaffUser } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { headers } = await adminContext();
  let users: StaffUser[] = [];
  let shops: Shop[] = [];
  try {
    [users, shops] = await Promise.all([api.users(headers), api.shops(headers)]);
  } catch {}
  return <UsersManager initialUsers={users} shops={shops} />;
}
