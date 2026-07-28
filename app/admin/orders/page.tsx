import { OrdersManager } from "@/components/admin/orders-manager";
import type { AdminDelivery } from "@/lib/tracking";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "http://localhost:5000";

export default async function AdminOrdersPage() {
  let orders: AdminDelivery[] = [];
  try {
    const response = await fetch(`${API_URL}/api/deliveries`, { cache: "no-store" });
    if (response.ok) orders = (await response.json()) as AdminDelivery[];
  } catch {
    // The manager reloads client-side and surfaces the failure there.
  }
  return <OrdersManager initialOrders={orders} />;
}
