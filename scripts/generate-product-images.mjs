/**
 * Draws an SVG rendering for every phone in the catalog and attaches it to the
 * product record.
 *
 *   API_URL=http://localhost:5000 node scripts/generate-product-images.mjs
 *
 * These are original illustrations, not photographs: one artwork per model
 * (shared across storage variants, as a real shop would), drawn from the model's
 * actual camera layout and colourway. Replace them with photos of real stock
 * when you have them. Pass --force to redraw products that already have images.
 */

import fs from "node:fs";
import path from "node:path";

const API_URL = process.env.API_URL || "http://localhost:5000";
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry");
const OUT_DIR = path.join(process.cwd(), "public", "products");

/**
 * camera: "single" | "double" | "triple" | "quad-strip" | "triple-strip"
 * front:  "notch" | "island" | "punch"
 */
const MODELS = [
  // ── iPhone ────────────────────────────────────────────────────────────────
  { match: /^iPhone 11 Pro Max/, key: "iphone-11-pro-max", body: "#4A5D52", camera: "triple", front: "notch" },
  { match: /^iPhone 11/, key: "iphone-11", body: "#2C2C2E", camera: "double", front: "notch" },
  { match: /^iPhone 12 Pro Max/, key: "iphone-12-pro-max", body: "#54524F", camera: "triple", front: "notch" },
  { match: /^iPhone 12 Pro/, key: "iphone-12-pro", body: "#54524F", camera: "triple", front: "notch" },
  { match: /^iPhone 12/, key: "iphone-12", body: "#2D4F6C", camera: "double", front: "notch" },
  { match: /^iPhone 13 Pro Max/, key: "iphone-13-pro-max", body: "#8FA9C4", camera: "triple", front: "notch" },
  { match: /^iPhone 13 Pro/, key: "iphone-13-pro", body: "#8FA9C4", camera: "triple", front: "notch" },
  { match: /^iPhone 13/, key: "iphone-13", body: "#1F2937", camera: "double", front: "notch" },
  { match: /^iPhone 14 Pro Max/, key: "iphone-14-pro-max", body: "#574E63", camera: "triple", front: "island" },
  { match: /^iPhone 14 Pro/, key: "iphone-14-pro", body: "#574E63", camera: "triple", front: "island" },
  { match: /^iPhone 14 Plus/, key: "iphone-14-plus", body: "#A3C1DA", camera: "double", front: "notch" },
  { match: /^iPhone 14/, key: "iphone-14", body: "#A3C1DA", camera: "double", front: "notch" },
  { match: /^iPhone 15 Pro Max/, key: "iphone-15-pro-max", body: "#C2BCB2", camera: "triple", front: "island" },
  { match: /^iPhone 15 Pro/, key: "iphone-15-pro", body: "#C2BCB2", camera: "triple", front: "island" },
  { match: /^iPhone 15 Plus/, key: "iphone-15-plus", body: "#D9C8CE", camera: "double", front: "island" },
  { match: /^iPhone 15/, key: "iphone-15", body: "#D9C8CE", camera: "double", front: "island" },
  { match: /^iPhone 16 Pro Max/, key: "iphone-16-pro-max", body: "#BFA48F", camera: "triple", front: "island" },
  { match: /^iPhone 17 Pro Max/, key: "iphone-17-pro-max", body: "#9A9AA0", camera: "triple", front: "island" },

  // ── Samsung ───────────────────────────────────────────────────────────────
  { match: /^Samsung Galaxy S25 Ultra/, key: "samsung-s25-ultra", body: "#6F7276", camera: "quad-strip", front: "punch" },
  { match: /^Samsung Galaxy S26 Ultra/, key: "samsung-s26-ultra", body: "#5B6068", camera: "quad-strip", front: "punch" },
  { match: /^Samsung Galaxy A06/, key: "samsung-a06", body: "#22252B", camera: "double-strip", front: "punch" },
  { match: /^Samsung Galaxy A07/, key: "samsung-a07", body: "#2A3340", camera: "double-strip", front: "punch" },
  { match: /^Samsung Galaxy A16/, key: "samsung-a16", body: "#1E4B45", camera: "triple-strip", front: "punch" },
  { match: /^Samsung Galaxy A17/, key: "samsung-a17", body: "#38424F", camera: "triple-strip", front: "punch" },
  { match: /^Samsung Galaxy A27/, key: "samsung-a27", body: "#4A3B52", camera: "triple-strip", front: "punch" },
  { match: /^Samsung Galaxy A37/, key: "samsung-a37", body: "#1F3A52", camera: "triple-strip", front: "punch" },
  { match: /^Samsung Galaxy A57/, key: "samsung-a57", body: "#2B2F3A", camera: "triple-strip", front: "punch" },
];

/** Darkens a #rrggbb colour by `amount` (0-1) for shading. */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 - amount));
  const g = clamp(((n >> 8) & 255) * (1 - amount));
  const b = clamp((n & 255) * (1 - amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lens(cx, cy, r, id) {
  return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#15161A"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="url(#glass${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="#0B0C0F"/>
      <circle cx="${cx - r * 0.26}" cy="${cy - r * 0.28}" r="${r * 0.16}" fill="#FFFFFF" opacity="0.55"/>`;
}

function cameraArt(spec, bodyColor) {
  const moduleFill = shade(bodyColor, 0.18);
  const stroke = shade(bodyColor, 0.36);

  if (spec === "triple" || spec === "double") {
    const size = spec === "triple" ? 172 : 150;
    const x = 96;
    const y = 118;
    const r = spec === "triple" ? 33 : 34;
    const lenses =
      spec === "triple"
        ? lens(x + 52, y + 52, r, "A") + lens(x + 120, y + 52, r, "B") + lens(x + 52, y + 120, r, "C")
        : lens(x + 48, y + 48, r, "A") + lens(x + 102, y + 102, r, "B");
    const flashY = spec === "triple" ? y + 120 : y + 48;
    const flashX = spec === "triple" ? x + 120 : x + 102;
    return `
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="46" fill="${moduleFill}" stroke="${stroke}" stroke-width="2"/>
      ${lenses}
      <circle cx="${flashX}" cy="${flashY}" r="14" fill="#F4E6C8"/>
      <circle cx="${flashX}" cy="${flashY}" r="7" fill="#FFF8E6"/>`;
  }

  // Samsung: bare lenses in a vertical column, no raised module.
  const counts = { "quad-strip": 4, "triple-strip": 3, "double-strip": 2 };
  const count = counts[spec] || 3;
  const cx = 138;
  let y = 132;
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const r = i === 0 ? 30 : 25;
    out += lens(cx, y + r, r, `S${i}`);
    y += r * 2 + 22;
  }
  out += `<circle cx="${cx}" cy="${y + 14}" r="11" fill="#F4E6C8"/>`;
  return out;
}

/** Positioned in the front device's own coordinates: screen is 13,13 → 295,595. */
function frontFeature(spec) {
  const centerX = 154;
  if (spec === "island") {
    return `<rect x="${centerX - 55}" y="34" width="110" height="32" rx="16" fill="#0A0B0E"/>
    <circle cx="${centerX + 36}" cy="50" r="7" fill="#12161F"/>`;
  }
  if (spec === "notch") {
    const w = 148;
    const left = centerX - w / 2;
    return `<path d="M${left} 13 h${w} v20 a24 24 0 0 1 -24 24 h-${w - 48} a24 24 0 0 1 -24 -24 z" fill="#0A0B0E"/>
    <rect x="${centerX - 20}" y="28" width="40" height="5" rx="2.5" fill="#1B2029"/>`;
  }
  return `<circle cx="${centerX}" cy="46" r="13" fill="#0A0B0E"/>
    <circle cx="${centerX}" cy="46" r="6" fill="#141A26"/>`;
}

function buildSvg(model) {
  const { body, camera, front } = model;
  const light = shade(body, -0.0);
  const dark = shade(body, 0.34);
  const edge = shade(body, 0.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${model.key} rendering">
  <defs>
    <linearGradient id="back" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${shade(body, -0.08) === body ? body : body}"/>
      <stop offset="45%" stop-color="${light}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#20242B"/>
      <stop offset="55%" stop-color="#11141A"/>
      <stop offset="100%" stop-color="#080A0D"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    ${["A", "B", "C", "S0", "S1", "S2", "S3"]
      .map(
        (id) => `<radialGradient id="glass${id}" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0%" stop-color="#3C4A63"/>
      <stop offset="55%" stop-color="#141821"/>
      <stop offset="100%" stop-color="#05060A"/>
    </radialGradient>`,
      )
      .join("\n    ")}
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#0F172A" flood-opacity="0.20"/>
    </filter>
  </defs>

  <!-- Back view, angled behind -->
  <g transform="translate(66 118) rotate(-8 140 280)" filter="url(#drop)">
    <rect x="0" y="0" width="280" height="560" rx="46" fill="url(#back)" stroke="${edge}" stroke-width="3"/>
    <rect x="10" y="10" width="260" height="540" rx="38" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2"/>
    <g transform="translate(0 0) scale(0.78)">${cameraArt(camera, body)}</g>
    <rect x="0" y="0" width="280" height="560" rx="46" fill="url(#sheen)"/>
  </g>

  <!-- Front view -->
  <g transform="translate(392 96) rotate(5 154 304)" filter="url(#drop)">
    <rect x="0" y="0" width="308" height="608" rx="50" fill="url(#back)" stroke="${edge}" stroke-width="3"/>
    <rect x="13" y="13" width="282" height="582" rx="40" fill="url(#screen)"/>
    ${frontFeature(front)}
    <rect x="13" y="13" width="282" height="582" rx="40" fill="url(#sheen)"/>
    <rect x="120" y="566" width="68" height="6" rx="3" fill="#FFFFFF" opacity="0.5"/>
  </g>
</svg>
`;
}

function modelFor(name) {
  return MODELS.find((m) => m.match.test(name));
}

async function main() {
  const response = await fetch(`${API_URL}/api/products`);
  if (!response.ok) throw new Error(`Could not read catalog: HTTP ${response.status}`);
  const products = await response.json();
  console.log(`Catalog holds ${products.length} products.${DRY_RUN ? "  [DRY RUN]" : ""}\n`);

  // Artwork is cheap to redraw, so always refresh every file. Only the slow part
  // — writing image URLs back to the catalogue — is skipped when already set.
  if (!DRY_RUN) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const model of MODELS) {
      fs.writeFileSync(path.join(OUT_DIR, `${model.key}.svg`), buildSvg(model), "utf8");
    }
    console.log(`Redrew ${MODELS.length} model artworks.\n`);
  }

  const drawn = new Set();
  let attached = 0;
  let skipped = 0;
  const unmatched = [];

  for (const product of products) {
    const model = modelFor(product.name);
    if (!model) {
      unmatched.push(product.name);
      continue;
    }

    const hasImage = Array.isArray(product.images) && product.images.length > 0;
    if (hasImage && !FORCE) {
      skipped += 1;
      continue;
    }

    const file = `${model.key}.svg`;
    if (!drawn.has(file)) {
      if (!DRY_RUN) fs.writeFileSync(path.join(OUT_DIR, file), buildSvg(model), "utf8");
      drawn.add(file);
    }

    const imageUrl = `/products/${file}`;
    if (DRY_RUN) {
      console.log(`  would attach ${imageUrl.padEnd(38)} -> ${product.name}`);
      attached += 1;
      continue;
    }

    const update = await fetch(`${API_URL}/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        sales_price: product.sales_price,
        currency: product.currency,
        sku: product.sku,
        barcode: product.barcode,
        status: product.status,
        stock: product.stock,
        low_stock_threshold: product.low_stock_threshold,
        categories: product.categories,
        images: [imageUrl],
      }),
    });

    if (!update.ok) {
      console.log(`  FAIL  ${product.name}  HTTP ${update.status}`);
      continue;
    }
    console.log(`  attached ${imageUrl.padEnd(38)} -> ${product.name}`);
    attached += 1;
  }

  console.log(`\nArtworks drawn: ${drawn.size} · Products updated: ${attached} · Already had images: ${skipped}`);
  if (unmatched.length) {
    console.log(`\nNo model artwork for ${unmatched.length} product(s) — left untouched:`);
    unmatched.forEach((n) => console.log(`  · ${n}`));
  }
}

main().catch((error) => {
  console.error("Image generation failed:", error.message);
  process.exitCode = 1;
});
