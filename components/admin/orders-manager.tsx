"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, MapPin, Phone, Mail, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DELIVERY_STAGES, STATUS_LABELS, type AdminDelivery, type DeliveryStatus } from "@/lib/tracking";
import { Pagination, usePagination } from "./pagination";
import { DeleteButton } from "./delete-button";

const money = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-amber-100 text-amber-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-[#dcfce7] text-[#166534]",
  cancelled: "bg-red-100 text-red-800",
};

const FILTERS: Array<{ id: string; label: string }> = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  ...DELIVERY_STAGES.map((s) => ({ id: s.id, label: s.label })),
  { id: "cancelled", label: "Cancelled" },
];

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "254")}`;

/**
 * Every storefront order — sent to WhatsApp or paid online — lands here as a
 * delivery record, with the details the customer typed at checkout.
 */
export function OrdersManager({ initialOrders }: { initialOrders: AdminDelivery[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/deliveries");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load orders.");
      setOrders(payload as AdminDelivery[]);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void reload(), 60000);
    return () => clearInterval(timer);
  }, [reload]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter === "open" && (order.status === "delivered" || order.status === "cancelled")) return false;
      if (filter !== "open" && filter !== "all" && order.status !== filter) return false;
      if (!term) return true;
      return [order.order_ref, order.customer_name, order.customer_phone, order.customer_email, order.city, order.address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [orders, search, filter]);

  const paging = usePagination(filtered, 10);

  async function patch(order: AdminDelivery, body: Record<string, unknown>) {
    setBusyId(order.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/deliveries/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update the order.");
      setOrders((current) => current.map((item) => (item.id === order.id ? (payload as AdminDelivery) : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the order.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOrder(order: AdminDelivery) {
    const res = await fetch(`/api/admin/deliveries/${order.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || `Could not delete order ${order.order_ref} (HTTP ${res.status}).`);
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  }

  const openCount = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0f172a]">
            <Receipt className="h-5 w-5 text-[#166534]" /> Orders
          </h2>
          <p className="text-sm text-[#64748b]">
            {openCount} open · {orders.length} total. Every website order appears here with the
            customer&apos;s checkout details.
          </p>
        </div>
        <Button variant="outline" onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && <p className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order number, name, phone, email or area…"
            className="pl-9"
          />
        </div>
        {FILTERS.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={filter === option.id ? "default" : "outline"}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#64748b]">
              {orders.length === 0
                ? "No website orders yet. They appear here the moment a customer checks out."
                : "No orders match this filter."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Where</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paging.visible.map((order) => {
                    const open = expanded === order.id;
                    return (
                      <Fragment key={order.id}>
                        <TableRow>
                          <TableCell className="font-mono text-xs font-bold">{order.order_ref}</TableCell>
                          <TableCell>
                            <span className="block">{order.customer_name || "—"}</span>
                            <span className="text-xs text-[#64748b]">{order.customer_phone}</span>
                          </TableCell>
                          <TableCell className="text-[#64748b]">
                            {order.fulfilment === "pickup"
                              ? "Collection"
                              : `${order.city || order.address || "Delivery"}${
                                  order.distance_km != null ? ` · ${order.distance_km.toFixed(1)} km` : ""
                                }`}
                          </TableCell>
                          <TableCell className="text-xs text-[#64748b]">{order.payment_status || "—"}</TableCell>
                          <TableCell className="font-bold text-[#166534]">{money(order.total)}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_STYLES[order.status] || ""}>
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-[#64748b]">{when(order.created_at)}</TableCell>
                          <TableCell>
                            <span className="flex justify-end">
                              <Button variant="ghost" size="sm" onClick={() => setExpanded(open ? null : order.id)}>
                                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <DeleteButton onDelete={() => deleteOrder(order)} label={`order ${order.order_ref}`} />
                            </span>
                          </TableCell>
                        </TableRow>

                        {open && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-[#f8faf5]">
                              <div className="grid gap-6 p-2 lg:grid-cols-2">
                                <div className="text-sm">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">
                                    Customer details from checkout
                                  </p>
                                  <p className="mt-3 font-bold text-[#0f172a]">{order.customer_name || "—"}</p>
                                  {order.customer_phone && (
                                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[#475569]">
                                      <Phone className="h-3.5 w-3.5 text-[#166534]" />
                                      <a href={`tel:${order.customer_phone.replace(/\s/g, "")}`} className="underline">
                                        {order.customer_phone}
                                      </a>
                                      <a
                                        href={waLink(order.customer_phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-[#1da851] underline"
                                      >
                                        WhatsApp
                                      </a>
                                    </p>
                                  )}
                                  {order.customer_email && (
                                    <p className="mt-2 flex items-center gap-2 text-[#475569]">
                                      <Mail className="h-3.5 w-3.5 text-[#166534]" />
                                      <a href={`mailto:${order.customer_email}`} className="underline">
                                        {order.customer_email}
                                      </a>
                                    </p>
                                  )}
                                  {order.address && (
                                    <p className="mt-2 flex items-start gap-2 text-[#475569]">
                                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#166534]" />
                                      <span>
                                        {order.address}
                                        {order.city ? `, ${order.city}` : ""}
                                        {order.lat != null && order.lng != null && (
                                          <>
                                            {" · "}
                                            <a
                                              href={`https://maps.google.com/?q=${order.lat},${order.lng}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-bold text-[#166534] underline"
                                            >
                                              Open pin
                                            </a>
                                          </>
                                        )}
                                      </span>
                                    </p>
                                  )}
                                  {order.notes && <p className="mt-2 text-[#475569]">Note: {order.notes}</p>}

                                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">
                                    Move to
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {DELIVERY_STAGES.map((stage) => (
                                      <Button
                                        key={stage.id}
                                        size="sm"
                                        variant={order.status === stage.id ? "default" : "outline"}
                                        disabled={busyId === order.id || order.status === stage.id}
                                        onClick={() => void patch(order, { status: stage.id })}
                                      >
                                        {stage.label}
                                      </Button>
                                    ))}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-300 text-red-700 hover:bg-red-50"
                                      disabled={busyId === order.id || order.status === "cancelled"}
                                      onClick={() => void patch(order, { status: "cancelled" as DeliveryStatus })}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>

                                <div className="text-sm">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">Items</p>
                                  <ul className="mt-3 space-y-1">
                                    {order.items.map((item, index) => (
                                      <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
                                        <span className="text-[#475569]">
                                          {item.name} × {item.quantity}
                                        </span>
                                        <b>{money(item.total)}</b>
                                      </li>
                                    ))}
                                    <li className="flex justify-between gap-4 border-t border-[#166534]/15 pt-1 text-[#475569]">
                                      <span>Delivery</span>
                                      <span>{order.delivery_fee > 0 ? money(order.delivery_fee) : "Free"}</span>
                                    </li>
                                    <li className="flex justify-between gap-4 font-bold text-[#0f172a]">
                                      <span>Total</span>
                                      <span>{money(order.total)}</span>
                                    </li>
                                  </ul>

                                  <p className="mt-4 text-[#475569]">
                                    {order.payment_method} · {order.payment_status}
                                  </p>

                                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">
                                    History
                                  </p>
                                  <ul className="mt-2 space-y-1 text-xs text-[#64748b]">
                                    {order.events.map((event, index) => (
                                      <li key={index}>
                                        {when(event.at)} — {STATUS_LABELS[event.status as DeliveryStatus] || event.status}
                                        {event.note ? ` · ${event.note}` : ""}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination state={paging} label="orders" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
