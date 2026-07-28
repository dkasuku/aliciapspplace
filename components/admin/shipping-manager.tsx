"use client";

import Link from "next/link";
import { Truck, MapPin, Store, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DELIVERY_TIERS,
  PICKUP_TIER,
  JUJA_TOWN_KM,
  NAIROBI_ZONE_KM,
  OUTSKIRTS_KM,
  MIN_DELIVERY_FEE,
  MAX_DELIVERY_FEE,
  SHOP_LABEL,
} from "@/lib/delivery";

const money = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

/**
 * Read-only view of the live delivery pricing. The rates are code, not data, so
 * this shows exactly what the storefront charges rather than a separate table
 * that could drift out of step with it.
 */
export function ShippingManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0f172a]">
          <Truck className="h-5 w-5 text-[#166534]" /> Delivery rates
        </h2>
        <p className="text-sm text-[#64748b]">
          What customers are charged at checkout, measured in a straight line from {SHOP_LABEL}.
        </p>
      </div>

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
                <TableHead>Zone</TableHead>
                <TableHead>Distance from Juja Square</TableHead>
                <TableHead className="text-right">Fee</TableHead>
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
                <TableCell className="text-right font-bold text-[#166534]">Free</TableCell>
              </TableRow>
              {DELIVERY_TIERS.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.label}</TableCell>
                  <TableCell className="text-[#64748b]">{tier.hint}</TableCell>
                  <TableCell className="text-right font-bold text-[#166534]">{money(tier.fee)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#64748b]">Cheapest delivery</p>
            <p className="mt-1 text-2xl font-bold text-[#166534]">{money(MIN_DELIVERY_FEE)}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Within {JUJA_TOWN_KM} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#64748b]">Most expensive</p>
            <p className="mt-1 text-2xl font-bold text-[#166534]">{money(MAX_DELIVERY_FEE)}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Beyond {OUTSKIRTS_KM} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#64748b]">Nairobi County edge</p>
            <p className="mt-1 text-2xl font-bold text-[#166534]">{NAIROBI_ZONE_KM} km</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Where the {money(400)} band ends</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-start gap-3 p-5 text-sm text-[#475569]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
          <div className="min-w-0 space-y-2">
            <p>
              Customers drop a pin on a map at checkout and the fee is calculated on the server from those
              coordinates, so it cannot be altered from the browser. Orders beyond {OUTSKIRTS_KM} km are flagged
              for you to confirm the exact fee before dispatch.
            </p>
            <p>
              To change these rates, edit the tier table in <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-xs">lib/delivery.ts</code>.
              Live orders and their delivery status are managed under{" "}
              <Link href="/admin/orders" className="font-bold text-[#166534] underline">Orders</Link> and{" "}
              <Link href="/admin/deliveries" className="font-bold text-[#166534] underline">Deliveries</Link>.
            </p>
            <Badge variant="secondary">Straight-line distance</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
