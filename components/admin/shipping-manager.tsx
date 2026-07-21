"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Plus } from "lucide-react";
import type { ShippingZone, ShippingMethod } from "@/lib/topduka/types";

const money = (v: number | string | undefined) => `KES ${Number(v || 0).toLocaleString()}`;

const methodTypeLabel = (type?: string) => {
  switch (type) {
    case "flat_rate": return "Flat rate";
    case "free_shipping": return "Free shipping";
    case "local_pickup": return "Local pickup";
    default: return type || "Custom";
  }
};

export function ShippingManager({ initialZones }: { initialZones: ShippingZone[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Shipping</h2>
          <p className="text-sm text-[#64748b]">{initialZones.length} shipping zones configured</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#166534] px-4 py-2 text-sm font-bold text-white hover:bg-[#14532d]">
          <Plus className="h-4 w-4" /> Add zone
        </button>
      </div>

      {initialZones.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="mx-auto h-12 w-12 text-[#cbd5e1]" />
            <p className="mt-4 text-sm text-[#64748b]">No shipping zones configured.</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Add a shipping zone to start offering delivery options.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {initialZones.map((zone) => (
            <Card key={zone.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#166534]" />
                  <CardTitle className="text-lg">{zone.name}</CardTitle>
                </div>
                <div className="ml-8 flex flex-wrap gap-2 text-xs text-[#64748b]">
                  {zone.country && <span>Country: {zone.country}</span>}
                  {zone.state_province && <span>· State: {zone.state_province}</span>}
                  {zone.city && <span>· City: {zone.city}</span>}
                </div>
              </CardHeader>
              <CardContent>
                {zone.methods && zone.methods.length > 0 ? (
                  <div className="space-y-2">
                    {zone.methods.map((method: ShippingMethod) => (
                      <div key={method.id} className="flex items-center justify-between rounded-lg border border-[#e2ece4] p-3">
                        <div className="flex items-center gap-3">
                          <Truck className="h-4 w-4 text-[#64748b]" />
                          <div>
                            <p className="text-sm font-bold text-[#0f172a]">{method.name}</p>
                            <p className="text-xs text-[#64748b]">{methodTypeLabel(method.type)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {method.free_over_amount != null && Number(method.free_over_amount) > 0 && (
                            <span className="text-xs text-[#64748b]">Free over {money(method.free_over_amount)}</span>
                          )}
                          <span className="font-bold text-[#166534]">{Number(method.price) === 0 ? "Free" : money(method.price)}</span>
                          <Badge variant={method.is_active === false ? "secondary" : "default"}>
                            {method.is_active === false ? "Inactive" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#64748b]">No shipping methods in this zone.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
