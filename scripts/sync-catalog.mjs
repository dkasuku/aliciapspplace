/**
 * Brings the catalogue in line with scripts/catalog.json — the shop's price list.
 *
 *   API_URL=http://localhost:5000 node scripts/sync-catalog.mjs [--dry]
 *
 * Adds phones that are missing, corrects prices that have moved, fills in key
 * features, and hides phones that are no longer stocked. Hiding rather than
 * deleting keeps sales history intact and is reversible from the admin panel.
 * Accessories, audio, tablets and gaming are left alone — only phones are
 * reconciled against the list.
 */

import fs from "node:fs";
import path from "node:path";

const API_URL = process.env.API_URL || "http://localhost:5000";
const DRY_RUN = process.argv.includes("--dry");
const DEFAULT_STOCK = 5;

const { phones } = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "catalog.json"), "utf8"));

/** Categories whose products are phones, and so subject to this list. */
const PHONE_CATEGORIES = new Set(["Smartphones", "Samsung", "Apple", "Tecno", "Infinix", "Vivo", "Xiaomi", "Oppo"]);
/**
 * A brand category alone does not make something a phone — an iPad and an
 * AirPods case both sit under "Apple". These win over the brand.
 */
const NOT_PHONE_CATEGORIES = new Set(["Tablets", "Audio", "Gaming", "Mobile Accessories", "Content Creator Kit"]);

/**
 * Specs we can state with confidence. Anything not listed here gets only the
 * facts the price list itself carries — inventing a chipset or battery figure
 * for a phone someone is about to pay for is not acceptable.
 */
const KNOWN = {
  "iPhone 11": { Display: '6.1-inch Liquid Retina HD LCD', Chipset: "Apple A13 Bionic", Cameras: "12MP dual rear; 12MP TrueDepth front", Security: "Face ID facial recognition" },
  "iPhone 11 Pro Max": { Display: '6.5-inch Super Retina XDR OLED', Chipset: "Apple A13 Bionic", Cameras: "12MP triple rear; 12MP TrueDepth front", Security: "Face ID facial recognition" },
  "iPhone 12": { Display: '6.1-inch Super Retina XDR OLED', Chipset: "Apple A14 Bionic", Cameras: "12MP dual rear; 12MP TrueDepth front", Security: "Face ID facial recognition" },
  "iPhone 12 Pro": { Display: '6.1-inch Super Retina XDR OLED', Chipset: "Apple A14 Bionic", Cameras: "12MP triple rear + LiDAR; 12MP front", Security: "Face ID facial recognition" },
  "iPhone 12 Pro Max": { Display: '6.7-inch Super Retina XDR OLED', Chipset: "Apple A14 Bionic", Cameras: "12MP triple rear + LiDAR; 12MP front", Security: "Face ID facial recognition" },
  "iPhone 13": { Display: '6.1-inch Super Retina XDR OLED', Chipset: "Apple A15 Bionic", Cameras: "12MP dual rear; 12MP TrueDepth front", Security: "Face ID facial recognition" },
  "iPhone 13 Pro": { Display: '6.1-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A15 Bionic", Cameras: "12MP triple rear + LiDAR; 12MP front", Security: "Face ID facial recognition" },
  "iPhone 13 Pro Max": { Display: '6.7-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A15 Bionic", Cameras: "12MP triple rear + LiDAR; 12MP front", Security: "Face ID facial recognition" },
  "iPhone 14": { Display: '6.1-inch Super Retina XDR OLED', Chipset: "Apple A15 Bionic", Cameras: "12MP dual rear; 12MP TrueDepth front", Security: "Face ID facial recognition" },
  "iPhone 14 Plus": { Display: '6.7-inch Super Retina XDR OLED', Chipset: "Apple A15 Bionic", Cameras: "12MP dual rear; 12MP TrueDepth front", Security: "Face ID facial recognition" },
  "iPhone 14 Pro": { Display: '6.1-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A16 Bionic", Cameras: "48MP main + ultra-wide + telephoto; 12MP front", Security: "Face ID facial recognition" },
  "iPhone 14 Pro Max": { Display: '6.7-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A16 Bionic", Cameras: "48MP main + ultra-wide + telephoto; 12MP front", Security: "Face ID facial recognition" },
  "iPhone 15": { Display: '6.1-inch Super Retina XDR OLED, Dynamic Island', Chipset: "Apple A16 Bionic", Cameras: "48MP main + ultra-wide; 12MP front", Security: "Face ID facial recognition", Connectivity: "5G, Wi-Fi 6, USB-C" },
  "iPhone 15 Plus": { Display: '6.7-inch Super Retina XDR OLED, Dynamic Island', Chipset: "Apple A16 Bionic", Cameras: "48MP main + ultra-wide; 12MP front", Security: "Face ID facial recognition", Connectivity: "5G, Wi-Fi 6, USB-C" },
  "iPhone 15 Pro": { Display: '6.1-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A17 Pro", Build: "Titanium frame", Cameras: "48MP main + ultra-wide + telephoto; 12MP front", Security: "Face ID facial recognition", Connectivity: "5G, Wi-Fi 6E, USB-C" },
  "iPhone 15 Pro Max": { Display: '6.7-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A17 Pro", Build: "Titanium frame", Cameras: "48MP main + ultra-wide + 5x telephoto; 12MP front", Security: "Face ID facial recognition", Connectivity: "5G, Wi-Fi 6E, USB-C" },
  "iPhone 16 Pro Max": { Display: '6.9-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A18 Pro", Build: "Titanium frame", Cameras: "48MP main + ultra-wide + 5x telephoto; 12MP front", Security: "Face ID facial recognition", Connectivity: "5G, Wi-Fi 7, USB-C" },
  "iPhone 17 Pro Max": { Display: '6.9-inch Super Retina XDR OLED, 120Hz ProMotion', Chipset: "Apple A19 Pro", Build: "Titanium frame", Cameras: "48MP main + ultra-wide + telephoto; 18MP front", Security: "Face ID facial recognition", Connectivity: "5G, Wi-Fi 7, USB-C" },
  "Galaxy S25 Ultra": { Display: '6.9-inch Dynamic AMOLED 2X, 120Hz', Chipset: "Snapdragon 8 Elite", Build: "Titanium frame, Gorilla Armor glass", Cameras: "200MP main + ultra-wide + 2 telephoto; 12MP front", Security: "Ultrasonic fingerprint + face unlock", Extras: "Built-in S Pen" },
  "Galaxy S26 Ultra": { Display: '6.9-inch Dynamic AMOLED 2X, 120Hz', Build: "Titanium frame", Cameras: "200MP main + ultra-wide + telephoto; high-res front", Security: "Ultrasonic fingerprint + face unlock", Extras: "Built-in S Pen" },
};

const OS_BY_BRAND = {
  Apple: "iOS",
  Samsung: "Android (One UI)",
  Tecno: "Android (HiOS)",
  Infinix: "Android (XOS)",
  Vivo: "Android (Funtouch OS)",
  Xiaomi: "Android (HyperOS)",
  Oppo: "Android (ColorOS)",
};

const nameFor = (p) => {
  const base = p.brand === "Apple" ? p.model : `${p.brand} ${p.model}`;
  const spec = p.ram ? `${p.ram}GB + ${p.storage}GB` : `${p.storage}GB`;
  return `${base} ${spec}`;
};

const skuFor = (p) => {
  const part = (t) => t.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
  return `${part(p.brand).slice(0, 3)}-${part(p.model)}-${p.ram ? `${p.ram}-` : ""}${p.storage}`;
};

/** Ordered so the product page reads like a spec sheet. */
function specsFor(p) {
  const known = KNOWN[p.model] || {};
  const rows = [];
  const push = (label, value) => value && rows.push({ label, value: String(value) });

  push("RAM", p.ram ? `${p.ram}GB` : known.RAM);
  push("Internal Storage", `${p.storage}GB`);
  push("Display", known.Display);
  push("Build", known.Build);
  push("OS", known.OS || OS_BY_BRAND[p.brand]);
  push("Chipset", known.Chipset);
  push("Connectivity", known.Connectivity || (p.network === "5G" ? "5G, Wi-Fi, Bluetooth, GPS" : "4G LTE, Wi-Fi, Bluetooth, GPS"));
  push("Cameras", known.Cameras);
  push("Battery", known.Battery);
  push("Security", known.Security);
  push("Extras", known.Extras);
  return rows;
}

const categoriesFor = (p) => (p.brand === "Apple" || p.brand === "Samsung" ? [p.brand, "Smartphones"] : [p.brand, "Smartphones"]);

async function api(pathname, method = "GET", body) {
  const res = await fetch(`${API_URL}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${pathname} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const existing = await api("/api/products");
  const byName = new Map(existing.map((p) => [p.name.trim().toLowerCase(), p]));
  console.log(`Catalogue: ${existing.length} products · price list: ${phones.length} phones${DRY_RUN ? "  [DRY RUN]" : ""}\n`);

  const wantedNames = new Set();
  let added = 0, updated = 0, held = 0;

  for (const phone of phones) {
    const name = nameFor(phone);
    wantedNames.add(name.toLowerCase());
    const current = byName.get(name.toLowerCase());
    const onSite = !phone.hold;
    if (phone.hold) held += 1;

    const payload = {
      name,
      description: `${phone.brand} ${phone.model}${phone.ram ? ` with ${phone.ram}GB RAM` : ""} and ${phone.storage}GB storage.`,
      price: phone.price,
      sku: skuFor(phone),
      currency: "KES",
      stock: phone.out_of_stock ? 0 : DEFAULT_STOCK,
      status: "active",
      categories: categoriesFor(phone),
      specs: specsFor(phone),
      visible_on_site: onSite,
      visible_in_pos: true,
      product_type: "sale",
    };

    if (!current) {
      if (!DRY_RUN) await api("/api/products", "POST", { ...payload, images: [] });
      console.log(`  + ${name.padEnd(42)} KES ${phone.price.toLocaleString()}${phone.hold ? "  [HELD OFF SITE]" : ""}`);
      added += 1;
      continue;
    }

    const priceMoved = Number(current.price) !== Number(phone.price);
    const needsSpecs = !current.specs || current.specs.length === 0;
    if (priceMoved || needsSpecs || current.visible_on_site !== onSite) {
      if (!DRY_RUN) {
        await api(`/api/products/${current.id}`, "PUT", {
          ...payload,
          images: current.images || [],
          sales_price: current.sales_price ?? null,
          low_stock_threshold: current.low_stock_threshold ?? 5,
          stock: current.stock,
        });
      }
      console.log(
        `  ~ ${name.padEnd(42)}${priceMoved ? ` price ${Number(current.price).toLocaleString()} -> ${phone.price.toLocaleString()}` : ""}${needsSpecs ? " +specs" : ""}${phone.hold ? "  [HELD OFF SITE]" : ""}`,
      );
      updated += 1;
    }
  }

  // Phones in the catalogue but no longer on the list.
  const stale = existing.filter((p) => {
    if (wantedNames.has(p.name.trim().toLowerCase())) return false;
    const cats = p.categories || [];
    if (cats.some((c) => NOT_PHONE_CATEGORIES.has(c))) return false;
    return cats.some((c) => PHONE_CATEGORIES.has(c));
  });

  let hidden = 0;
  for (const p of stale) {
    if (p.visible_on_site === false && p.visible_in_pos === false) continue;
    if (!DRY_RUN) {
      await api(`/api/products/${p.id}`, "PUT", {
        name: p.name, slug: p.slug, description: p.description, price: p.price,
        sales_price: p.sales_price ?? null, currency: p.currency, sku: p.sku, barcode: p.barcode,
        status: p.status, stock: p.stock, low_stock_threshold: p.low_stock_threshold,
        categories: p.categories, images: p.images || [], specs: p.specs || [],
        product_type: p.product_type || "sale",
        visible_on_site: false, visible_in_pos: false,
      });
    }
    console.log(`  - hidden (not on the list): ${p.name}`);
    hidden += 1;
  }

  console.log(`\nAdded ${added} · updated ${updated} · hidden ${hidden} · held off site ${held}`);
  if (held) console.log("Held items have a suspicious price — confirm it, clear \"hold\" in scripts/catalog.json, re-run.");
}

main().catch((e) => {
  console.error("Sync failed:", e.message);
  process.exitCode = 1;
});
