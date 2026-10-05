import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { SalesHistory } from "@/components/admin/sales-history";
import type { Sale } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  const { headers, manager } = await adminContext();
  let sales: Sale[] = [];
  try {
    sales = await api.sales.list(headers);
  } catch {}
  return <SalesHistory initialSales={sales} canDelete={manager} />;
}
