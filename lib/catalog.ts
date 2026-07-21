import type { Category, Product, InventoryItem, Sale, Stats } from "@/lib/api/types";

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

export const fallbackCategories: Category[] = [
  { id: "samsung", name: "Samsung", slug: "samsung", is_active: true },
  { id: "apple", name: "Apple", slug: "apple", is_active: true },
  { id: "smartphones", name: "Smartphones", slug: "smartphones", is_active: true },
  { id: "mobile-accessories", name: "Mobile Accessories", slug: "mobile-accessories", is_active: true },
  { id: "audio", name: "Audio", slug: "audio", is_active: true },
  { id: "gaming", name: "Gaming", slug: "gaming", is_active: true },
  { id: "tablets", name: "Tablets", slug: "tablets", is_active: true },
  { id: "content-creator-kit", name: "Content Creator Kit", slug: "content-creator-kit", is_active: true },
  { id: "wearables", name: "Wearables", slug: "wearables", is_active: true },
  { id: "laptops", name: "Laptops", slug: "laptops", is_active: true },
];

export const fallbackProducts: Product[] = [
  { id: "iphone-16-pro", name: "Apple iPhone 16 Pro 128GB", price: 155000, sales_price: 149999, currency: "KES", categories: ["Smartphones"], stock: 8, product_type: "rental", rental_terms: "KES 411/day for 365 days", description: "Titanium design, pro camera system and the fast A18 Pro chip in a compact flagship phone.", images: [image("photo-1727013884184-b313982327f3")] },
  { id: "samsung-s24-ultra", name: "Samsung Galaxy S24 Ultra 256GB", price: 169000, sales_price: 159999, currency: "KES", categories: ["Smartphones"], stock: 6, product_type: "rental", rental_terms: "KES 438/day for 365 days", description: "Galaxy AI, a built-in S Pen and a 200 MP camera for your biggest everyday ideas.", images: [image("photo-1705585175110-d25f92c183aa")] },
  { id: "samsung-a55", name: "Samsung Galaxy A55 5G 256GB", price: 58000, sales_price: 54999, currency: "KES", categories: ["Smartphones"], stock: 14, description: "A durable metal design, vivid Super AMOLED display and dependable all-day battery.", images: [image("photo-1705530292519-ec81f2ace70d")] },
  { id: "pixel-9-pro", name: "Google Pixel 9 Pro 256GB", price: 142000, sales_price: 135000, currency: "KES", categories: ["Smartphones"], stock: 10, description: "Google AI, an exceptional triple camera and a polished 6.3-inch Super Actua display.", images: [image("photo-1598327105666-5b89351aff97")] },
  { id: "iphone-15", name: "Apple iPhone 15 128GB", price: 121000, sales_price: 115999, currency: "KES", categories: ["Smartphones"], stock: 12, description: "A bright Super Retina XDR display, 48 MP main camera and USB-C connectivity.", images: [image("photo-1511707171634-5f897ff02aa9")] },
  { id: "tecno-camon-30", name: "Tecno Camon 30 Premier 5G", price: 59900, sales_price: 54999, currency: "KES", categories: ["Smartphones"], stock: 16, description: "A flagship 50 MP camera system, smooth 120 Hz display and powerful everyday performance.", images: [image("photo-1601784551446-20c9e07cdbdb")] },
  { id: "tecno-spark-20", name: "Tecno Spark 20 Pro+ 256GB", price: 28900, sales_price: 26999, currency: "KES", categories: ["Smartphones"], stock: 20, description: "Large AMOLED display, generous storage and a 108 MP camera made for everyday creativity.", images: [image("photo-1580910051074-3eb694886505")] },
  { id: "iphone-15-pro-rental", name: "Apple iPhone 15 Pro 256GB", price: 145000, sales_price: 139999, currency: "KES", categories: ["Smartphones"], stock: 5, product_type: "rental", rental_terms: "KES 384/day for 365 days", description: "Titanium build, A17 Pro chip and a pro camera system with 3x telephoto zoom.", images: [image("photo-1695048101321-55e9b13e2d6e")] },
  { id: "samsung-a55-rental", name: "Samsung Galaxy A55 5G (Lipa Pole Pole)", price: 58000, sales_price: 54999, currency: "KES", categories: ["Smartphones"], stock: 10, product_type: "rental", rental_terms: "KES 151/day for 365 days", description: "A durable metal design, vivid Super AMOLED display and dependable all-day battery on Lipa Pole Pole.", images: [image("photo-1705530292519-ec81f2ace70d")] },
  { id: "tecno-camon-30-rental", name: "Tecno Camon 30 Premier 5G (Lipa Pole Pole)", price: 59900, sales_price: 54999, currency: "KES", categories: ["Smartphones"], stock: 8, product_type: "rental", rental_terms: "KES 151/day for 365 days", description: "A flagship 50 MP camera system, smooth 120 Hz display on Lipa Pole Pole daily payments.", images: [image("photo-1601784551446-20c9e07cdbdb")] },
  { id: "pixel-9-pro-rental", name: "Google Pixel 9 Pro 256GB (Lipa Pole Pole)", price: 142000, sales_price: 135000, currency: "KES", categories: ["Smartphones"], stock: 4, product_type: "rental", rental_terms: "KES 370/day for 365 days", description: "Google AI, an exceptional triple camera and a polished 6.3-inch Super Actua display on Lipa Pole Pole.", images: [image("photo-1598327105666-5b89351aff97")] },
  { id: "iphone-15-rental", name: "Apple iPhone 15 128GB (Lipa Pole Pole)", price: 121000, sales_price: 115999, currency: "KES", categories: ["Smartphones"], stock: 6, product_type: "rental", rental_terms: "KES 318/day for 365 days", description: "A bright Super Retina XDR display, 48 MP main camera and USB-C connectivity on Lipa Pole Pole.", images: [image("photo-1511707171634-5f897ff02aa9")] },
  { id: "airpods-pro-2", name: "Apple AirPods Pro (2nd generation)", price: 38900, sales_price: 34999, currency: "KES", categories: ["Audio"], stock: 15, description: "Adaptive Audio, active noise cancellation and a USB-C charging case.", images: [image("photo-1664271294066-2dfd418b15b1")] },
  { id: "sony-wh1000xm5", name: "Sony WH-1000XM5 Wireless Headphones", price: 52900, sales_price: 48999, currency: "KES", categories: ["Audio"], stock: 12, description: "Industry-leading noise cancellation and up to 30 hours of detailed wireless sound.", images: [image("photo-1733041055704-da53567e49da")] },
  { id: "galaxy-watch-7", name: "Samsung Galaxy Watch7 44mm", price: 38900, sales_price: 35999, currency: "KES", categories: ["Wearables"], stock: 9, description: "A bright AMOLED display, advanced health insights and a sleek everyday fit.", images: [image("photo-1523275335684-37898b6baf30")] },
  { id: "apple-watch-10", name: "Apple Watch Series 10 GPS 46mm", price: 69900, sales_price: 65999, currency: "KES", categories: ["Wearables"], stock: 7, description: "A bigger display, faster charging and refined fitness tracking for daily life.", images: [image("photo-1546868871-7041f2a55e12")] },
  { id: "macbook-air-m3", name: "Apple MacBook Air M3 13-inch", price: 189000, sales_price: 179999, currency: "KES", categories: ["Laptops"], stock: 5, description: "Supercharged by M3 with a brilliant Liquid Retina display in a thin, quiet design.", images: [image("photo-1517336714731-489689fd1ca8")] },
  { id: "logitech-g-pro-x", name: "Logitech G PRO X 2 LIGHTSPEED", price: 28900, sales_price: 25999, currency: "KES", categories: ["Gaming"], stock: 11, description: "Tournament-ready wireless gaming headset with immersive 50 mm graphene drivers.", images: [image("photo-1599669454699-248893623440")] },
  { id: "anker-prime-powerbank", name: "Anker Prime 20,000mAh Power Bank", price: 18900, sales_price: 16999, currency: "KES", categories: ["Accessories"], stock: 18, description: "High-speed multi-device charging with a smart display and airline-friendly capacity.", images: [image("photo-1609592424824-76e4c4a17b1d")] },
  { id: "belkin-gan-charger", name: "Belkin BoostCharge Pro 65W GaN", price: 8900, sales_price: 7999, currency: "KES", categories: ["Accessories"], stock: 22, description: "Compact 65W USB-C power for a laptop, phone and every essential in your bag.", images: [image("photo-1583863788434-e58a36330cf0")] },
  { id: "sandisk-extreme-ssd", name: "SanDisk Extreme Portable SSD 1TB", price: 17900, sales_price: 15999, currency: "KES", categories: ["Accessories", "Content Creator Kit"], stock: 14, description: "Fast, rugged portable storage built for creative work and life on the move.", images: [image("photo-1597872200969-2b65d56bd16b")] },
  { id: "ipad-air-m2", name: "Apple iPad Air M2 11-inch", price: 95000, sales_price: 89999, currency: "KES", categories: ["Tablets"], stock: 8, description: "The M2 chip, a stunning Liquid Retina display and Apple Pencil support for work and play.", images: [image("photo-1636345554479-ecdf092d122f")] },
  { id: "samsung-tab-s9", name: "Samsung Galaxy Tab S9 11-inch", price: 89000, sales_price: 82999, currency: "KES", categories: ["Tablets"], stock: 6, description: "A vibrant AMOLED display, included S Pen and quad speakers tuned by AKG.", images: [image("photo-1661595676830-2a0a1ccab283")] },
  { id: "rode-wireless-mic", name: "Rode Wireless GO II Compact Microphone", price: 24500, sales_price: 21999, currency: "KES", categories: ["Content Creator Kit"], stock: 10, description: "Dual-channel wireless audio with onboard recording, perfect for vlogs and interviews.", images: [image("photo-1590602847861-f357a9332bbc")] },
  { id: "ring-light-18", name: "Ulanzi 18-inch RGB Ring Light", price: 8900, sales_price: 7499, currency: "KES", categories: ["Content Creator Kit"], stock: 15, description: "Adjustable color temperature, phone mount and tripod adapter for flawless content lighting.", images: [image("photo-1606986628253-49e0c7c5b4d9")] },
  { id: "manfrotto-tripod", name: "Manfrotto Befree Advanced Tripod", price: 15900, sales_price: 13999, currency: "KES", categories: ["Content Creator Kit"], stock: 9, description: "Lightweight, travel-ready aluminum tripod with a ball head for steady shots anywhere.", images: [image("photo-1502920917128-1aa500764cbd")] },
  { id: "logitech-webcam", name: "Logitech Brio 4K Webcam", price: 19500, sales_price: 17499, currency: "KES", categories: ["Content Creator Kit"], stock: 11, description: "Ultra HD 4K streaming, auto-framing and HDR for professional video calls and content.", images: [image("photo-1587222318665-1f0b3b2b3b2b")] },
  { id: "phone-case-samsung", name: "Spigen Tough Armor Samsung Case", price: 2900, sales_price: 2499, currency: "KES", categories: ["Mobile Accessories"], stock: 30, description: "Dual-layer shock absorption with a built-in kickstand for Samsung Galaxy phones.", images: [image("photo-1601593396740-987b76b26a72")] },
  { id: "usb-c-cable", name: "Anker PowerLine III USB-C Cable 6ft", price: 1900, sales_price: 1499, currency: "KES", categories: ["Mobile Accessories"], stock: 40, description: "Durable braided USB-C cable with fast charging and data transfer for everyday devices.", images: [image("photo-1588872693042-61b46e7c3a26")] },
  { id: "screen-protector", name: "amFilm Glass Screen Protector", price: 1200, sales_price: 999, currency: "KES", categories: ["Mobile Accessories"], stock: 50, description: "9H tempered glass with precise cutouts and oleophobic coating for scratch protection.", images: [image("photo-1592286927505-1def25115558")] },
];

export function findFallbackProduct(id: string) {
  return fallbackProducts.find((product) => product.id === id);
}

export const fallbackInventory: InventoryItem[] = fallbackProducts.map((p) => ({
  id: p.id,
  name: p.name,
  sku: p.sku || p.id.toUpperCase().replace(/-/g, "-"),
  stock: p.stock ?? 0,
  low_stock_threshold: 5,
  status: (p.stock ?? 0) === 0 ? "out_of_stock" : (p.stock ?? 0) <= 5 ? "low_stock" : "in_stock",
  is_low: (p.stock ?? 0) <= 5,
  price: p.price,
  sales_price: p.sales_price,
}));

export const fallbackSales: Sale[] = [
  {
    id: "sale-001",
    receipt_no: "RCP-2026-0001",
    total: 54999,
    subtotal: 54999,
    tax: 0,
    discount: 0,
    payment_method: "M-Pesa",
    customer_name: "John Mwangi",
    customer_phone: "+254 712 345 678",
    status: "completed",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [{ product_id: "samsung-a55", product_name: "Samsung Galaxy A55 5G 256GB", quantity: 1, unit_price: 54999, total: 54999 }],
  },
  {
    id: "sale-002",
    receipt_no: "RCP-2026-0002",
    total: 34999,
    subtotal: 34999,
    tax: 0,
    discount: 0,
    payment_method: "Cash",
    customer_name: "Sarah Wanjiru",
    customer_phone: "+254 722 987 654",
    status: "completed",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    items: [{ product_id: "airpods-pro-2", product_name: "Apple AirPods Pro (2nd generation)", quantity: 1, unit_price: 34999, total: 34999 }],
  },
  {
    id: "sale-003",
    receipt_no: "RCP-2026-0003",
    total: 89999,
    subtotal: 89999,
    tax: 0,
    discount: 0,
    payment_method: "Card",
    customer_name: "Peter Kamau",
    customer_phone: "+254 733 456 123",
    status: "completed",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    items: [{ product_id: "ipad-air-m2", product_name: "Apple iPad Air M2 11-inch", quantity: 1, unit_price: 89999, total: 89999 }],
  },
  {
    id: "sale-004",
    receipt_no: "RCP-2026-0004",
    total: 26999,
    subtotal: 26999,
    tax: 0,
    discount: 0,
    payment_method: "M-Pesa",
    customer_name: "Grace Achieng",
    customer_phone: "+254 700 111 222",
    status: "completed",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    items: [{ product_id: "tecno-spark-20", product_name: "Tecno Spark 20 Pro+ 256GB", quantity: 1, unit_price: 26999, total: 26999 }],
  },
  {
    id: "sale-005",
    receipt_no: "RCP-2026-0005",
    total: 7499,
    subtotal: 7499,
    tax: 0,
    discount: 0,
    payment_method: "Cash",
    customer_name: "Walk-in customer",
    customer_phone: null,
    status: "completed",
    created_at: new Date().toISOString(),
    items: [{ product_id: "ring-light-18", product_name: "Ulanzi 18-inch RGB Ring Light", quantity: 1, unit_price: 7499, total: 7499 }],
  },
];

export interface Discount {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  uses: number;
  max_uses?: number | null;
  expires_at?: string | null;
}

export const fallbackDiscounts: Discount[] = [
  { id: "discount-1", name: "New Customer Welcome", code: "WELCOME10", type: "percentage", value: 10, active: true, uses: 24, max_uses: 100, expires_at: null },
  { id: "discount-2", name: "Lipa Pole Pole Promo", code: "LIPOLE50", type: "fixed", value: 500, active: true, uses: 12, max_uses: 50, expires_at: null },
  { id: "discount-3", name: "Festive Season Sale", code: "FESTIVE15", type: "percentage", value: 15, active: true, uses: 38, max_uses: null, expires_at: null },
  { id: "discount-4", name: "Back to School", code: "SCHOOL1000", type: "fixed", value: 1000, active: false, uses: 60, max_uses: 100, expires_at: null },
  { id: "discount-5", name: "Black Friday Mega Deal", code: "BLACKFRIDAY20", type: "percentage", value: 20, active: true, uses: 5, max_uses: 200, expires_at: null },
];

export const fallbackStats: Stats = {
  total_products: fallbackProducts.length,
  total_categories: fallbackCategories.length,
  low_stock: fallbackInventory.filter((i) => i.is_low && i.stock > 0).length,
  out_of_stock: fallbackInventory.filter((i) => i.stock === 0).length,
  total_sales: fallbackSales.length,
  revenue: fallbackSales.reduce((sum, s) => sum + s.total, 0),
  today_sales: fallbackSales.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).length,
  today_revenue: fallbackSales.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0),
};
