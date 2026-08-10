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
const { models: SPECS } = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "phone-specs.json"), "utf8"));

/** Categories whose products are phones, and so subject to this list. */
const PHONE_CATEGORIES = new Set(["Smartphones", "Samsung", "Apple", "Tecno", "Infinix", "Vivo", "Xiaomi", "Oppo"]);
/**
 * A brand category alone does not make something a phone — an iPad and an
 * AirPods case both sit under "Apple". These win over the brand.
 */
const NOT_PHONE_CATEGORIES = new Set(["Tablets", "Audio", "Gaming", "Mobile Accessories", "Content Creator Kit"]);

/** Every phone shows the same ten rows, in this order. */
const SPEC_ORDER = [
  "RAM", "Internal Storage", "Display", "OS", "Chipset",
  "Cameras", "Network", "Connectivity", "Battery", "Colors",
];

const OS_BY_BRAND = {
  Apple: "iOS",
  Samsung: "Android (One UI)",
  Tecno: "Android (HiOS)",
  Infinix: "Android (XOS)",
  Vivo: "Android (Funtouch OS)",
  Xiaomi: "Android (HyperOS)",
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

/** Key for phone-specs.json — Apple models are stored without the brand prefix. */
const specKey = (p) => (p.brand === "Apple" ? p.model : `${p.brand} ${p.model}`);

/**
 * Builds the full ten-row sheet. RAM and storage come from the price list so
 * each variant is right; the rest is the per-model sheet. Nothing is left out,
 * so every phone reads the same way on the site.
 */
function specsFor(p) {
  const sheet = SPECS[specKey(p)] || {};
  const values = {
    RAM: p.ram ? `${p.ram}GB` : sheet.RAM || "See product description",
    "Internal Storage": `${p.storage}GB`,
    Display: sheet.Display,
    OS: sheet.OS || OS_BY_BRAND[p.brand],
    Chipset: sheet.Chipset,
    Cameras: sheet.Cameras,
    Network: sheet.Network || (p.network === "5G" ? "5G" : "4G LTE"),
    Connectivity: sheet.Connectivity || "Wi-Fi, Bluetooth, GPS",
    Battery: sheet.Battery,
    Colors: sheet.Colors,
  };

  return SPEC_ORDER.filter((label) => values[label]).map((label) => ({ label, value: String(values[label]) }));
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
    // Compare the whole sheet, not just "has any specs" — otherwise a phone
    // that already had a partial list never picks up the added rows.
    const wanted = specsFor(phone);
    const specsChanged = JSON.stringify(current.specs || []) !== JSON.stringify(wanted);
    if (priceMoved || specsChanged || current.visible_on_site !== onSite) {
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
        `  ~ ${name.padEnd(42)}${priceMoved ? ` price ${Number(current.price).toLocaleString()} -> ${phone.price.toLocaleString()}` : ""}${specsChanged ? ` specs->${wanted.length} rows` : ""}${phone.hold ? "  [HELD OFF SITE]" : ""}`,
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
