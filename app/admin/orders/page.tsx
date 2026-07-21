import { orders } from "@/lib/topduka";
import { OrdersManager } from "@/components/admin/orders-manager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let orderList: Array<Record<string, unknown>> = [];
  try {
    const data = await orders.list();
    orderList = data as unknown as Array<Record<string, unknown>>;
  } catch {}
  return <OrdersManager initialOrders={orderList as never} />;
}
