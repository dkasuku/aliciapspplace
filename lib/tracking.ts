export type DeliveryStatus =
  | "received"
  | "confirmed"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface DeliveryStage {
  id: DeliveryStatus;
  label: string;
  detail: string;
}

/** The happy path, in order. "cancelled" sits outside it. */
export const DELIVERY_STAGES: DeliveryStage[] = [
  { id: "received", label: "Order received", detail: "We have your order and are checking stock." },
  { id: "confirmed", label: "Confirmed", detail: "Stock and delivery details confirmed with you." },
  { id: "packed", label: "Packed", detail: "Your item is packed and waiting for the rider." },
  { id: "out_for_delivery", label: "Out for delivery", detail: "The rider is on the way to you." },
  { id: "delivered", label: "Delivered", detail: "Handed over. Enjoy it!" },
];

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  received: "Order received",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function stageIndex(status: string): number {
  return DELIVERY_STAGES.findIndex((stage) => stage.id === status);
}

export interface DeliveryEvent {
  status: string;
  note?: string | null;
  at: string;
}

export interface TrackedDelivery {
  order_ref: string;
  status: DeliveryStatus;
  fulfilment: "delivery" | "pickup";
  customer_name?: string | null;
  address?: string | null;
  city?: string | null;
  distance_km?: number | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  items: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
  payment_method?: string | null;
  payment_status?: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  eta?: string | null;
  events: DeliveryEvent[];
  created_at?: string | null;
  updated_at?: string | null;
}

/** Full delivery record as the admin sees it. */
export interface AdminDelivery extends TrackedDelivery {
  id: string;
  receipt_no?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function trackingUrl(origin: string, orderRef: string): string {
  return `${origin.replace(/\/$/, "")}/track?ref=${encodeURIComponent(orderRef)}`;
}
