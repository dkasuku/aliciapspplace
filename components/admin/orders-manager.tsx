"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

type Order = {
  id?: string;
  order_number?: number | string;
  status?: string;
  total?: number | string;
  currency?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items?: Array<{ name?: string; product_name?: string; quantity?: number; total?: number | string; price?: number | string }>;
  created_at?: string;
  payment_method?: string;
  [key: string]: unknown;
};

const money = (v: number | string | undefined, currency = "KES") =>
  `${currency} ${Number(v || 0).toLocaleString()}`;

const statusVariant = (status?: string): "default" | "secondary" | "destructive" | "warning" => {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver") || s.includes("complete") || s.includes("fulfilled")) return "default";
  if (s.includes("cancel") || s.includes("fail")) return "destructive";
  if (s.includes("pending") || s.includes("process")) return "warning";
  return "secondary";
};

const StatusIcon = ({ status }: { status?: string }) => {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver") || s.includes("complete") || s.includes("fulfilled"))
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (s.includes("cancel") || s.includes("fail"))
    return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-amber-600" />;
};

export function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(o.order_number || "").includes(q) ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      (o.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Orders</h2>
          <p className="text-sm text-[#64748b]">{orders.length} total orders</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-[#cbd5e1]" />
            <p className="mt-4 text-sm text-[#64748b]">No orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id || order.order_number} className="cursor-pointer transition hover:shadow-md" >
              <CardContent className="flex items-center justify-between p-4" >
                <div className="flex items-center gap-4" onClick={() => setSelected(order)}>
                  <StatusIcon status={order.status} />
                  <div>
                    <p className="font-bold text-[#0f172a]">#{order.order_number || order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-[#64748b]">
                      {order.customer_name || "Guest"} · {order.items?.length ?? 0} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusVariant(order.status)}>{order.status || "pending"}</Badge>
                  <span className="font-bold text-[#166534]">{money(order.total, order.currency as string)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto" >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{selected.order_number || selected.id?.slice(0, 8)}</CardTitle>
                <button onClick={() => setSelected(null)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={selected.status} />
                <Badge variant={statusVariant(selected.status)}>{selected.status || "pending"}</Badge>
                <span className="text-xs text-[#64748b]">{selected.created_at ? new Date(selected.created_at).toLocaleString() : ""}</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-bold">Customer:</span> {selected.customer_name || "Guest"}</p>
                {selected.customer_email && <p><span className="font-bold">Email:</span> {selected.customer_email}</p>}
                {selected.customer_phone && <p><span className="font-bold">Phone:</span> {selected.customer_phone}</p>}
                {selected.payment_method && <p><span className="font-bold">Payment:</span> {selected.payment_method}</p>}
              </div>
              {selected.items && selected.items.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Items</p>
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.name || item.product_name || "Product"} × {item.quantity}</span>
                      <span className="font-bold">{money(item.total || (Number(item.price || 0) * Number(item.quantity || 0)), selected.currency as string)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-[#166534]">{money(selected.total, selected.currency as string)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
