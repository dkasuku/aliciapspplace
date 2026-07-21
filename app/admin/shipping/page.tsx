import { shipping } from "@/lib/topduka";
import { ShippingManager } from "@/components/admin/shipping-manager";
import type { ShippingZone } from "@/lib/topduka/types";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  let zones: ShippingZone[] = [];
  try {
    zones = await shipping.zones();
  } catch {}
  return <ShippingManager initialZones={zones} />;
}
