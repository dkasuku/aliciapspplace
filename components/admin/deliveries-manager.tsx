"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Truck, MapPin, Phone, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DELIVERY_STAGES, STATUS_LABELS, type AdminDelivery, type DeliveryStatus } from "@/lib/tracking";

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

export function DeliveriesManager({ initialDeliveries }: { initialDeliveries: AdminDelivery[] }) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rider, setRider] = useState({ rider_name: "", rider_phone: "", eta: "" });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/deliveries");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load deliveries.");
      setDeliveries(payload as AdminDelivery[]);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load deliveries.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the board fresh while it is open on the counter screen.
  useEffect(() => {
    const timer = setInterval(() => void reload(), 60000);
    return () => clearInterval(timer);
  }, [reload]);

  async function patch(delivery: AdminDelivery, body: Record<string, unknown>) {
    setBusyId(delivery.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update the delivery.");
      setDeliveries((current) => current.map((item) => (item.id === delivery.id ? (payload as AdminDelivery) : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the delivery.");
    } finally {
      setBusyId(null);
    }
  }

  const active = deliveries.filter((d) => d.status !== "delivered" && d.status !== "cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0f172a]">
            <Truck className="h-5 w-5 text-[#166534]" /> Deliveries
          </h2>
          <p className="text-sm text-[#64748b]">
            {active} in progress · {deliveries.length} total. Customers see every change on /track.
          </p>
        </div>
        <Button variant="outline" onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && <p className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {deliveries.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#64748b]">
              No deliveries yet. They appear here the moment an order is placed on the storefront.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Where</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => {
                  const open = expanded === delivery.id;
                  return (
                    <Fragment key={delivery.id}>
                      <TableRow>
                        <TableCell className="font-mono text-xs font-bold">{delivery.order_ref}</TableCell>
                        <TableCell>
                          <span className="block">{delivery.customer_name || "—"}</span>
                          <span className="text-xs text-[#64748b]">{delivery.customer_phone}</span>
                        </TableCell>
                        <TableCell className="text-[#64748b]">
                          {delivery.fulfilment === "pickup"
                            ? "Collection"
                            : `${delivery.city || delivery.address || "Delivery"}${
                                delivery.distance_km != null ? ` · ${delivery.distance_km.toFixed(1)} km` : ""
                              }`}
                        </TableCell>
                        <TableCell className="font-bold text-[#166534]">{money(delivery.total)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_STYLES[delivery.status] || ""}>
                            {STATUS_LABELS[delivery.status] || delivery.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[#64748b]">{when(delivery.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpanded(open ? null : delivery.id);
                              setRider({
                                rider_name: delivery.rider_name || "",
                                rider_phone: delivery.rider_phone || "",
                                eta: delivery.eta || "",
                              });
                            }}
                          >
                            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {open && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-[#f8faf5]">
                            <div className="grid gap-6 p-2 lg:grid-cols-2">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">Move to</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {DELIVERY_STAGES.map((stage) => (
                                    <Button
                                      key={stage.id}
                                      size="sm"
                                      variant={delivery.status === stage.id ? "default" : "outline"}
                                      disabled={busyId === delivery.id || delivery.status === stage.id}
                                      onClick={() => void patch(delivery, { status: stage.id })}
                                    >
                                      {stage.label}
                                    </Button>
                                  ))}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                    disabled={busyId === delivery.id || delivery.status === "cancelled"}
                                    onClick={() => void patch(delivery, { status: "cancelled" as DeliveryStatus })}
                                  >
                                    Cancel
                                  </Button>
                                </div>

                                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">
                                  Rider & ETA
                                </p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                  <Input
                                    placeholder="Rider name"
                                    value={rider.rider_name}
                                    onChange={(event) => setRider({ ...rider, rider_name: event.target.value })}
                                  />
                                  <Input
                                    placeholder="Rider phone"
                                    value={rider.rider_phone}
                                    onChange={(event) => setRider({ ...rider, rider_phone: event.target.value })}
                                  />
                                  <Input
                                    placeholder="ETA e.g. by 4pm"
                                    value={rider.eta}
                                    onChange={(event) => setRider({ ...rider, eta: event.target.value })}
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  className="mt-3"
                                  disabled={busyId === delivery.id}
                                  onClick={() => void patch(delivery, rider)}
                                >
                                  Save rider details
                                </Button>
                              </div>

                              <div className="text-sm">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">Order</p>
                                <ul className="mt-3 space-y-1">
                                  {delivery.items.map((item, index) => (
                                    <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
                                      <span className="text-[#475569]">{item.name} × {item.quantity}</span>
                                      <b>{money(item.total)}</b>
                                    </li>
                                  ))}
                                  <li className="flex justify-between gap-4 border-t border-[#166534]/15 pt-1 text-[#475569]">
                                    <span>Delivery</span>
                                    <span>{delivery.delivery_fee > 0 ? money(delivery.delivery_fee) : "Free"}</span>
                                  </li>
                                </ul>

                                <p className="mt-4 text-[#475569]">{delivery.payment_status}</p>

                                {delivery.address && (
                                  <p className="mt-3 flex items-start gap-2 text-[#475569]">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#166534]" />
                                    <span>
                                      {delivery.address}
                                      {delivery.city ? `, ${delivery.city}` : ""}
                                      {delivery.lat != null && delivery.lng != null && (
                                        <>
                                          {" · "}
                                          <a
                                            href={`https://maps.google.com/?q=${delivery.lat},${delivery.lng}`}
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
                                {delivery.customer_phone && (
                                  <p className="mt-2 flex items-center gap-2 text-[#475569]">
                                    <Phone className="h-3.5 w-3.5 text-[#166534]" />
                                    <a href={`tel:${delivery.customer_phone.replace(/\s/g, "")}`} className="underline">
                                      {delivery.customer_phone}
                                    </a>
                                  </p>
                                )}
                                {delivery.notes && <p className="mt-2 text-[#475569]">Note: {delivery.notes}</p>}

                                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">History</p>
                                <ul className="mt-2 space-y-1 text-xs text-[#64748b]">
                                  {delivery.events.map((event, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
