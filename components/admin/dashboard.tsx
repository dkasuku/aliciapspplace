"use client";

import Link from "next/link";
import {
  Package,
  Boxes,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, Sale, Stats } from "@/lib/api/types";

const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

export function Dashboard({
  stats,
  products,
  sales,
}: {
  stats: Stats | null;
  products: Product[];
  sales: Sale[];
}) {
  const lowStockProducts = products.filter(
    (p) => (p.stock ?? 0) <= (p.low_stock_threshold ?? 5)
  );
  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Dashboard</h2>
        <p className="text-sm text-[#64748b]">Overview of your store performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={money(stats?.revenue ?? 0)}
          icon={<TrendingUp className="h-5 w-5 text-[#166534]" />}
          sub={`Today: ${money(stats?.today_revenue ?? 0)}`}
        />
        <StatCard
          title="Total Sales"
          value={String(stats?.total_sales ?? 0)}
          icon={<ShoppingCart className="h-5 w-5 text-[#166534]" />}
          sub={`Today: ${stats?.today_sales ?? 0}`}
        />
        <StatCard
          title="Products"
          value={String(stats?.total_products ?? 0)}
          icon={<Package className="h-5 w-5 text-[#166534]" />}
          sub={`${stats?.total_categories ?? 0} categories`}
        />
        <StatCard
          title="Stock Alerts"
          value={String(stats?.low_stock ?? 0)}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          sub={`${stats?.out_of_stock ?? 0} out of stock`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-[#64748b]">All products are well stocked.</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-[#64748b]">SKU: {p.sku || "N/A"}</p>
                    </div>
                    <Badge variant={p.stock === 0 ? "destructive" : "warning"}>
                      {p.stock} left
                    </Badge>
                  </div>
                ))}
                <Link href="/admin/inventory">
                  <Button variant="outline" size="sm" className="w-full">
                    <Boxes className="mr-2 h-4 w-4" /> Manage inventory
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#166534]" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-[#64748b]">No sales yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.receipt_no}</p>
                      <p className="text-xs text-[#64748b]">
                        {s.items?.length ?? 0} items · {s.payment_method}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#166534]">
                      {money(s.total)}
                    </span>
                  </div>
                ))}
                <Link href="/admin/sales">
                  <Button variant="outline" size="sm" className="w-full">
                    View all sales
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/products">
              <Button><Package className="mr-2 h-4 w-4" /> Manage products</Button>
            </Link>
            <Link href="/admin/pos">
              <Button variant="secondary"><ShoppingCart className="mr-2 h-4 w-4" /> Open POS</Button>
            </Link>
            <Link href="/admin/inventory">
              <Button variant="outline"><Boxes className="mr-2 h-4 w-4" /> Restock items</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#64748b]">{title}</p>
          {icon}
        </div>
        <p className="mt-2 text-2xl font-bold text-[#0f172a]">{value}</p>
        {sub && <p className="mt-1 text-xs text-[#64748b]">{sub}</p>}
      </CardContent>
    </Card>
  );
}
