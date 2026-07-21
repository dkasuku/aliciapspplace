import { api } from "@/lib/api";
import { SalesHistory } from "@/components/admin/sales-history";
import { fallbackSales } from "@/lib/catalog";
import type { Sale } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  let sales: Sale[] = [];
  try {
    sales = await api.sales.list();
  } catch {}
  if (!sales.length) sales = fallbackSales;
  return <SalesHistory initialSales={sales} />;
}
