export interface LatLng {
  lat: number;
  lng: number;
}

/** Juja town — every delivery is measured and priced out from here. */
export const SHOP_LOCATION: LatLng = { lat: -1.1018, lng: 37.0144 };
export const SHOP_LABEL = "Alicia Phone Place · Juja Town";

/** KES 70 buys a 2 km radius; each further 2 km band costs another 70. */
export const BAND_KM = 2;
export const BAND_FEE = 70;

export type Fulfilment = "delivery" | "pickup";

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

/** Which 2 km band a distance falls into. 0 – 2 km is band 1, 2 – 4 km is band 2, and so on. */
export function bandFor(km: number): number {
  return Math.max(1, Math.ceil(km / BAND_KM));
}

export function feeForDistance(km: number): number {
  return bandFor(km) * BAND_FEE;
}

export function bandLabel(km: number): string {
  const band = bandFor(km);
  return `${(band - 1) * BAND_KM} – ${band * BAND_KM} km from Juja`;
}

export interface DeliveryQuote {
  fee: number;
  km: number;
  label: string;
}

/** Quotes a drop-off point. Always recomputed on the server so the fee cannot be forged. */
export function quoteDelivery(point: LatLng | null | undefined): DeliveryQuote {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return { fee: 0, km: 0, label: "Pick up in store" };
  }
  const km = distanceKm(SHOP_LOCATION, point);
  return { fee: feeForDistance(km), km, label: bandLabel(km) };
}

export function mapsLink(point: LatLng): string {
  return `https://maps.google.com/?q=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}
