"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Truck, MapPin, Store, Info, Plus, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DELIVERY_TIERS,
  PICKUP_TIER,
  MIN_DELIVERY_FEE,
  MAX_DELIVERY_FEE,
  SHOP_LABEL,
  type DeliveryTier,
} from "@/lib/delivery";
import { DeleteButton } from "./delete-button";

const money = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

/**
 * Edits the delivery rates the storefront charges. Stored in the site content so
 * the shop can change prices without a deploy; the server still recomputes each
 * order's fee from these rates, so nothing here can be forged by a shopper.
 */
export function ShippingManager() {
  const [tiers, setTiers] = useState<DeliveryTier[]>(DELIVERY_TIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/site-content")
      .then((r) => r.json())
      .then((content: { deliveryTiers?: DeliveryTier[] }) => {
        if (active && content.deliveryTiers?.length) setTiers(content.deliveryTiers);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function update(index: number, patch: Partial<DeliveryTier>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
    setMessage(null);
  }

  async function save() {
    const invalid = tiers.find((t) => !t.label.trim() || !Number.isFinite(Number(t.fee)));
    if (invalid) {
      setError("Every zone needs a name and a numeric fee.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const current = await (await fetch("/api/site-content")).json();
      const response = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, deliveryTiers: tiers.map((t) => ({ ...t, fee: Number(t.fee) })) }),
      });
      if (!response.ok) throw new Error(`Save failed (HTTP ${response.status}).`);
      setMessage("Delivery rates saved. The storefront uses them straight away.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the rates.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0f172a]">
            <Truck className="h-5 w-5 text-[#166534]" /> Delivery rates
          </h2>
          <p className="text-sm text-[#64748b]">
            What customers are charged at checkout, measured in a straight line from {SHOP_LABEL}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setTiers(DELIVERY_TIERS); setMessage("Reset to the built-in rates — press Save to apply."); }}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset
          </Button>
          <Button onClick={() => void save()} disabled={saving || loading}>
            <Save className="mr-2 h-3.5 w-3.5" /> {saving ? "Saving…" : "Save rates"}
          </Button>
        </div>
      </div>

      {error && <p className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {message && <p className="border border-[#166534]/30 bg-[#f0fdf4] p-4 text-sm text-[#166534]">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-[#166534]" /> Distance bands
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone name</TableHead>
                <TableHead>Description shown to customers</TableHead>
                <TableHead className="w-32">Up to (km)</TableHead>
                <TableHead className="w-32">Fee (KES)</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <Store className="h-3.5 w-3.5 text-[#166534]" /> {PICKUP_TIER.label}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748b]">{PICKUP_TIER.hint}</TableCell>
                <TableCell className="text-[#94a3b8]">—</TableCell>
                <TableCell className="font-bold text-[#166534]">Free</TableCell>
                <TableCell />
              </TableRow>
              {tiers.map((tier, index) => (
                <TableRow key={tier.id || index}>
                  <TableCell>
                    <Input value={tier.label} onChange={(e) => update(index, { label: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={tier.hint} onChange={(e) => update(index, { hint: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={tier.maxKm ?? ""}
                      placeholder="beyond"
                      onChange={(e) => update(index, { maxKm: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={MIN_DELIVERY_FEE}
                      max={MAX_DELIVERY_FEE}
                      value={tier.fee}
                      onChange={(e) => update(index, { fee: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      label={`the ${tier.label} zone`}
                      onDelete={() => setTiers((prev) => prev.filter((_, i) => i !== index))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-[#166534]/15 p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTiers((prev) => [
                  ...prev,
                  { id: `zone-${Date.now()}`, label: "New zone", hint: "", fee: MIN_DELIVERY_FEE, maxKm: null },
                ])
              }
            >
              <Plus className="mr-1 h-3 w-3" /> Add zone
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-start gap-3 p-5 text-sm text-[#475569]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
          <div className="min-w-0 space-y-2">
            <p>
              Leave <b>Up to (km)</b> blank on the last row — that zone catches every distance beyond the one above
              it. Rows are applied nearest-first, so order them by distance.
            </p>
            <p>
              Fees are clamped to {money(MIN_DELIVERY_FEE)}–{money(MAX_DELIVERY_FEE)}. Customers pin their location
              on a map and the fee is calculated on the server, so it cannot be changed from the browser.
            </p>
            <p>
              Live orders are managed under{" "}
              <Link href="/admin/orders" className="font-bold text-[#166534] underline">Orders</Link> and{" "}
              <Link href="/admin/deliveries" className="font-bold text-[#166534] underline">Deliveries</Link>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
