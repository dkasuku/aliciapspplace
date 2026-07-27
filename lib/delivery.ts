export interface DeliveryZone {
  id: string;
  label: string;
  hint: string;
  fee: number;
}

/** Delivery pricing. Fees are in KES and are always resolved server-side by id. */
export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "pickup", label: "Pick up in store", hint: "Juja Town — collect it yourself", fee: 0 },
  { id: "0-5km", label: "0 – 5 km", hint: "Juja town and nearby", fee: 70 },
  { id: "5-10km", label: "5 – 10 km", hint: "Juja outskirts, Witeithie, Kalimoni", fee: 120 },
  { id: "10-20km", label: "10 – 20 km", hint: "Thika, Ruiru and similar", fee: 200 },
  { id: "20km+", label: "Over 20 km", hint: "Nairobi and further out", fee: 300 },
];

export const DEFAULT_ZONE_ID = "0-5km";

export function findZone(id: string | undefined | null): DeliveryZone | undefined {
  return DELIVERY_ZONES.find((zone) => zone.id === id);
}

/** Never trust a fee sent by the client — look it up from the zone id instead. */
export function deliveryFeeFor(id: string | undefined | null): number {
  return findZone(id)?.fee ?? 0;
}
