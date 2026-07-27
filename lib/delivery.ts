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
    hint: `Further than ${NAIROBI_ZONE_KM} km — payable on order`,
    fee: 600,
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

export function tierForDistance(km: number): DeliveryTier {
  return DELIVERY_TIERS.find((tier) => tier.maxKm != null && km <= tier.maxKm) ?? DELIVERY_TIERS[DELIVERY_TIERS.length - 1];
}

export interface DeliveryQuote {
  fee: number;
  km: number;
  label: string;
  tier: string;
  note?: string;
}

/** Quotes a drop-off point. Always recomputed on the server so the fee cannot be forged. */
export function quoteDelivery(point: LatLng | null | undefined): DeliveryQuote {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return { fee: PICKUP_TIER.fee, km: 0, label: PICKUP_TIER.label, tier: PICKUP_TIER.id };
  }
  const km = distanceKm(SHOP_LOCATION, point);
  const tier = tierForDistance(km);
  return { fee: tier.fee, km, label: tier.label, tier: tier.id, note: tier.note };
}

export function mapsLink(point: LatLng): string {
  return `https://maps.google.com/?q=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}
