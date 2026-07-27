/** Where every storefront order is sent. */
export const ORDER_WHATSAPP_NUMBER = "254724126009";
export const ORDER_WHATSAPP_DISPLAY = "+254 724 126 009";

export interface OrderLine {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface OrderSummary {
  reference: string;
  items: OrderLine[];
  subtotal: number;
  delivery_fee: number;
  delivery_label: string;
  delivery_km?: number;
  map_link?: string;
  fulfilment: "delivery" | "pickup";
  drop_off?: { lat: number; lng: number };
  tracking_url?: string;
  total: number;
  /** Short code stored on the sale record — the Sale.payment_method column is String(30). */
  payment_code: string;
  payment_label: string;
  payment_status: string;
  payment_reference?: string;
  full_name: string;
  phone_number: string;
  email: string;
  address_line1?: string;
  city?: string;
  notes?: string;
}

const money = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

export function buildOrderMessage(order: OrderSummary): string {
  const lines: string[] = [
    "*NEW ORDER — Alicia Phone Place*",
    `Order ref: ${order.reference}`,
    "",
    "*Items*",
    ...order.items.map(
      (item, index) =>
        `${index + 1}. ${item.name} × ${item.quantity} — ${money(item.total || item.unit_price * item.quantity)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery (${order.delivery_label}): ${order.delivery_fee > 0 ? money(order.delivery_fee) : "Free"}`,
    `*TOTAL: ${money(order.total)}*`,
    "",
    "*Payment*",
    `Method: ${order.payment_label}`,
    `Status: ${order.payment_status}`,
  ];

  if (order.payment_reference) lines.push(`Reference: ${order.payment_reference}`);

  lines.push(
    "",
    "*Customer*",
    `Name: ${order.full_name}`,
    `Phone: ${order.phone_number}`,
    `Email: ${order.email}`,
  );

  if (order.address_line1) lines.push(`Address: ${order.address_line1}`);
  if (order.city) lines.push(`City / area: ${order.city}`);
  if (order.notes) lines.push(`Notes: ${order.notes}`);

  if (order.map_link) {
    lines.push(
      "",
      "*Drop-off pin*",
      `${order.delivery_km?.toFixed(1)} km from Juja town`,
      order.map_link,
    );
  }

  if (order.tracking_url) {
    lines.push("", "*Track this delivery*", order.tracking_url);
  }

  return lines.join("\n");
}

export function buildOrderWhatsAppLink(order: OrderSummary): string {
  return `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(order))}`;
}
