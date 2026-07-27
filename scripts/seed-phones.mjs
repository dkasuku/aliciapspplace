/**
 * Seeds the Samsung and iPhone stock list into the catalog.
 *
 *   API_URL=http://localhost:5000 node scripts/seed-phones.mjs
 *
 * Idempotent: products already in the catalog (matched by name) are skipped,
 * so re-running only adds what is missing. Pass --dry to preview.
 */

const API_URL = process.env.API_URL || "http://localhost:5000";
const DRY_RUN = process.argv.includes("--dry");

/** No stock counts were supplied, so every phone starts here. Adjust in admin. */
const DEFAULT_STOCK = 5;

// [model, ram(GB) | null, storage(GB), price]
const SAMSUNG = [
  ["Galaxy A06", 4, 64, 12500],
  ["Galaxy A07", 4, 64, 13500],
  ["Galaxy A07", 4, 128, 15000],
  ["Galaxy A16", 4, 128, 18000],
  ["Galaxy A17", 4, 128, 20000],
  ["Galaxy A17", 6, 128, 22500],
  ["Galaxy A17", 4, 256, 25700],
  ["Galaxy A27", null, 256, 36500],
  ["Galaxy A37", 4, 256, 50000],
  ["Galaxy A57", null, 128, 52000],
  ["Galaxy S25 Ultra", null, 256, 108000],
  ["Galaxy S25 Ultra", null, 512, 125000],
  ["Galaxy S26 Ultra", null, 256, 120000],
  ["Galaxy S26 Ultra", null, 512, 153000],
];

// [model, storage(GB), price]
const IPHONE = [
  ["iPhone 11", 128, 27000],
  ["iPhone 11", 256, 31000],
  ["iPhone 11 Pro Max", 256, 36000],
  ["iPhone 12", 128, 31000],
  ["iPhone 12", 256, 33000],
  ["iPhone 12 Pro", 128, 38000],
  ["iPhone 12 Pro", 256, 40000],
  ["iPhone 12 Pro Max", 256, 48000],
  ["iPhone 13", 128, 38000],
  ["iPhone 13", 256, 39000],
  ["iPhone 13 Pro", 128, 47000],
  ["iPhone 13 Pro", 256, 53000],
  ["iPhone 13 Pro Max", 256, 60000],
  ["iPhone 14", 128, 42000],
  ["iPhone 14", 256, 46000],
  ["iPhone 14 Plus", 128, 49000],
  ["iPhone 14 Plus", 256, 54000],
  ["iPhone 14 Pro", 128, 57000],
  ["iPhone 14 Pro", 256, 61000],
  ["iPhone 14 Pro Max", 256, 67000],
  ["iPhone 15", 128, 57000],
  ["iPhone 15", 256, 63000],
  ["iPhone 15 Plus", 128, 64000],
  ["iPhone 15 Plus", 256, 71000],
  ["iPhone 15 Pro", 128, 67000],
  ["iPhone 15 Pro", 256, 73000],
  ["iPhone 15 Pro Max", 256, 83000],
  ["iPhone 16 Pro Max", 256, 109000],
  ["iPhone 17 Pro Max", 256, 145000],
];

const skuPart = (text) =>
  text.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();

function buildCatalog() {
  const items = [];

  for (const [model, ram, storage, price] of SAMSUNG) {
    const spec = ram ? `${ram}GB + ${storage}GB` : `${storage}GB`;
    items.push({
      name: `Samsung ${model} ${spec}`,
      price,
      sku: `SAM-${skuPart(model)}-${ram ? `${ram}-` : ""}${storage}`,
      categories: ["Samsung", "Smartphones"],
      description: ram
        ? `Samsung ${model} with ${ram}GB RAM and ${storage}GB storage.`
        : `Samsung ${model} with ${storage}GB storage.`,
    });
  }

  for (const [model, storage, price] of IPHONE) {
    items.push({
      name: `${model} ${storage}GB`,
      price,
      sku: `IPH-${skuPart(model.replace(/^iPhone /, ""))}-${storage}`,
      categories: ["Apple", "Smartphones"],
      description: `${model} with ${storage}GB storage.`,
    });
  }

  return items;
}

async function main() {
  const catalog = buildCatalog();
  console.log(`Catalog to seed: ${catalog.length} phones (${SAMSUNG.length} Samsung, ${IPHONE.length} iPhone)`);
  console.log(`Target: ${API_URL}${DRY_RUN ? "  [DRY RUN — nothing will be written]" : ""}\n`);

  const existingResponse = await fetch(`${API_URL}/api/products`);
  if (!existingResponse.ok) throw new Error(`Could not read catalog: HTTP ${existingResponse.status}`);
  const existing = await existingResponse.json();
  const seen = new Set(existing.map((p) => String(p.name).trim().toLowerCase()));
  console.log(`Catalog already holds ${existing.length} products.\n`);

  let added = 0;
  let skipped = 0;
  const failures = [];

  for (const item of catalog) {
    if (seen.has(item.name.toLowerCase())) {
      console.log(`  skip   ${item.name}  (already in catalog)`);
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  would add  ${item.name.padEnd(40)} KES ${item.price.toLocaleString()}  ${item.sku}`);
      added += 1;
      continue;
    }

    const response = await fetch(`${API_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        currency: "KES",
        stock: DEFAULT_STOCK,
        status: "active",
        images: [],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.log(`  FAIL   ${item.name}  HTTP ${response.status} ${detail.slice(0, 120)}`);
      failures.push(item.name);
      continue;
    }

    console.log(`  added  ${item.name.padEnd(40)} KES ${item.price.toLocaleString()}`);
    seen.add(item.name.toLowerCase());
    added += 1;
  }

  console.log(`\n${DRY_RUN ? "Would add" : "Added"}: ${added} · Skipped: ${skipped} · Failed: ${failures.length}`);
  if (failures.length) {
    console.log("Failed items:", failures.join(", "));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
});
