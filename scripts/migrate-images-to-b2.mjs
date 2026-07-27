/**
 * Moves inline base64 images out of the database and into object storage.
 *
 *   API_URL=http://localhost:5000 node scripts/migrate-images-to-b2.mjs [--dry]
 *
 * Any product image stored as a `data:` URI is uploaded through the backend's
 * /api/uploads endpoint and replaced with the returned URL. Products already on
 * URLs are left alone, so this is safe to re-run.
 */

const API_URL = process.env.API_URL || "http://localhost:5000";
const DRY_RUN = process.argv.includes("--dry");

const isDataUri = (value) => typeof value === "string" && value.startsWith("data:");

function decodeDataUri(uri) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(uri);
  if (!match) return null;
  const [, mime, isBase64, payload] = match;
  const buffer = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mime, buffer };
}

async function uploadBuffer(buffer, mime, filename) {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), filename);
  const response = await fetch(`${API_URL}/api/uploads`, { method: "POST", body: form });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || `upload failed with HTTP ${response.status}`);
  }
  return payload.url;
}

async function main() {
  const configResponse = await fetch(`${API_URL}/api/uploads/config`);
  const { uploads_enabled: enabled } = await configResponse.json();
  if (!enabled && !DRY_RUN) {
    console.error("Image storage is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET and B2_ENDPOINT.");
    process.exitCode = 1;
    return;
  }

  const products = await (await fetch(`${API_URL}/api/products`)).json();
  const affected = products.filter((p) => (p.images || []).some(isDataUri));

  const inlineBytes = affected.reduce(
    (sum, p) => sum + (p.images || []).filter(isDataUri).reduce((n, uri) => n + uri.length, 0),
    0,
  );

  console.log(`Catalog: ${products.length} products`);
  console.log(`With inline base64 images: ${affected.length}`);
  console.log(`Inline weight in the database: ${(inlineBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(DRY_RUN ? "\n[DRY RUN — nothing will be changed]\n" : "");

  if (!affected.length) {
    console.log("Nothing to migrate.");
    return;
  }

  let moved = 0;
  for (const product of affected) {
    const next = [];
    for (const [index, image] of (product.images || []).entries()) {
      if (!isDataUri(image)) {
        next.push(image);
        continue;
      }
      const decoded = decodeDataUri(image);
      if (!decoded) {
        console.log(`  skip   ${product.name} image ${index}: unreadable data URI`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  would move ${product.name} image ${index} (${(decoded.buffer.length / 1024).toFixed(0)} KB)`);
        moved += 1;
        continue;
      }
      try {
        const url = await uploadBuffer(decoded.buffer, decoded.mime, `${product.slug || "image"}-${index}`);
        console.log(`  moved  ${product.name} image ${index} -> ${url}`);
        next.push(url);
        moved += 1;
      } catch (error) {
        console.log(`  FAIL   ${product.name} image ${index}: ${error.message}`);
        next.push(image);
      }
    }

    if (DRY_RUN) continue;

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
        images: next,
      }),
    });
    if (!update.ok) console.log(`  FAIL   saving ${product.name}: HTTP ${update.status}`);
  }

  console.log(`\n${DRY_RUN ? "Would move" : "Moved"} ${moved} image(s) out of the database.`);
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
