export interface LatLng {
  lat: number;
  lng: number;
}

/** Juja Square, Juja town — every delivery is measured and priced out from here. */
export const SHOP_LOCATION: LatLng = { lat: -1.1018, lng: 37.0144 };
export const SHOP_LABEL = "Alicia Phone Place · Juja Square, Juja Town";

/** Distance at which we stop calling it "Juja town". */
export const JUJA_TOWN_KM = 3;
/** Outer edge of the Nairobi County rate. */
export const NAIROBI_ZONE_KM = 12;
/** Beyond this we charge the top rate and confirm the fee by hand. */
export const OUTSKIRTS_KM = 25;

/** Delivery never costs less than this, and never more. */
export const MIN_DELIVERY_FEE = 100;
export const MAX_DELIVERY_FEE = 700;

export type Fulfilment = "delivery" | "pickup";

export interface DeliveryTier {
  id: string;
  label: string;
  hint: string;
  fee: number;
  /** Upper bound in km from Juja Square. null means "anything beyond". */
  maxKm: number | null;
  note?: string;
}

export const DELIVERY_TIERS: DeliveryTier[] = [
  {
    id: "juja-town",
    label: "Juja town",
    hint: `Within ${JUJA_TOWN_KM} km of Juja Square`,
    fee: 100,
    maxKm: JUJA_TOWN_KM,
  },
  {
    id: "nairobi-county",
    label: "Nairobi County",
    hint: `Up to ${NAIROBI_ZONE_KM} km from Juja Square`,
    fee: 400,
    maxKm: NAIROBI_ZONE_KM,
  },
  {
    id: "outside-juja",
    label: "Outside Juja town",
    hint: `${NAIROBI_ZONE_KM} – ${OUTSKIRTS_KM} km — payable on order`,
    fee: 600,
    maxKm: OUTSKIRTS_KM,
  },
  {
    id: "far",
    label: "Further afield",
    hint: `Over ${OUTSKIRTS_KM} km — payable on order`,
    fee: MAX_DELIVERY_FEE,
    maxKm: null,
    note: "You are outside our usual range, so we will contact you to confirm the exact delivery fee before dispatch.",
  },
];

export const PICKUP_TIER: DeliveryTier = {
  id: "pickup",
  label: "Pick up in store",
  hint: "Juja Square, Juja Town",
  fee: 0,
  maxKm: null,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Straight-line distance in km between two points. */
export function distanceKm(from: LatLng, to: LatLng): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Resolves against a shop-edited tier list when one is supplied, falling back to
 * the built-in table. Overrides are validated: a malformed list is ignored
 * rather than allowed to produce a free or nonsensical delivery.
 */
export function resolveTiers(override?: DeliveryTier[] | null): DeliveryTier[] {
  if (!override || !override.length) return DELIVERY_TIERS;
  const clean = override
    .filter((t) => t && typeof t.label === "string" && Number.isFinite(Number(t.fee)))
    .map((t) => ({
      id: String(t.id || t.label),
      label: String(t.label),
      hint: String(t.hint ?? ""),
      fee: Math.min(MAX_DELIVERY_FEE, Math.max(MIN_DELIVERY_FEE, Number(t.fee))),
      maxKm: t.maxKm == null ? null : Number(t.maxKm),
      note: t.note,
    }))
    .sort((a, b) => (a.maxKm ?? Infinity) - (b.maxKm ?? Infinity));
  return clean.length ? clean : DELIVERY_TIERS;
}

export function tierForDistance(km: number, tiers: DeliveryTier[] = DELIVERY_TIERS): DeliveryTier {
  return tiers.find((tier) => tier.maxKm != null && km <= tier.maxKm) ?? tiers[tiers.length - 1];
}

export interface DeliveryQuote {
  fee: number;
  km: number;
  label: string;
  tier: string;
  note?: string;
}

/** Quotes a drop-off point. Always recomputed on the server so the fee cannot be forged. */
export function quoteDelivery(point: LatLng | null | undefined, tiers?: DeliveryTier[] | null): DeliveryQuote {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return { fee: PICKUP_TIER.fee, km: 0, label: PICKUP_TIER.label, tier: PICKUP_TIER.id };
  }
  const km = distanceKm(SHOP_LOCATION, point);
  const tier = tierForDistance(km, resolveTiers(tiers));
  // Delivery never falls below KES 100 or climbs past KES 700, whatever the tiers say.
  const fee = Math.min(MAX_DELIVERY_FEE, Math.max(MIN_DELIVERY_FEE, tier.fee));
  return { fee, km, label: tier.label, tier: tier.id, note: tier.note };
}

export function mapsLink(point: LatLng): string {
  return `https://maps.google.com/?q=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}
