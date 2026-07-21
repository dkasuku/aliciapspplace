import { chromium } from 'playwright';
import fs from 'fs';

const email = process.env.DASHBOARD_EMAIL;
const password = process.env.DASHBOARD_PASSWORD;
const outDir = 'tmp';
fs.mkdirSync(outDir, { recursive: true });

if (!email || !password) {
  console.error('Set DASHBOARD_EMAIL and DASHBOARD_PASSWORD env vars');
  process.exit(1);
}

const products = [
  { name: 'Samsung Galaxy S24 Ultra', category: 'Samsung', price: 169999, sku: 'SGS24U-256', stock: 10, description: '6.8" QHD+ AMOLED, 200MP camera, 5000mAh, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage' },
  { name: 'Samsung Galaxy S24+', category: 'Samsung', price: 129999, sku: 'SGS24P-256', stock: 12, description: '6.7" Dynamic AMOLED, 50MP camera, 4900mAh, 12GB RAM, 256GB storage' },
  { name: 'iPhone 16 Pro Max', category: 'Apple', price: 189999, sku: 'IP16PM-256', stock: 8, description: '6.9" Super Retina XDR, A18 Pro chip, 48MP camera, titanium design' },
  { name: 'iPhone 16 Pro', category: 'Apple', price: 159999, sku: 'IP16P-128', stock: 10, description: '6.3" Super Retina XDR, A18 Pro chip, 48MP camera system' },
  { name: 'Tecno Camon 30 Premier', category: 'Smartphones', price: 54999, sku: 'TCC30P-512', stock: 15, description: '6.77" 120Hz AMOLED, 50MP triple camera, 5G, 70W charging' },
  { name: 'Google Pixel 8 Pro', category: 'Smartphones', price: 119999, sku: 'GPX8P-128', stock: 7, description: '6.7" LTPO OLED, Google Tensor G3, advanced AI camera' },
  { name: 'AirPods Pro 2', category: 'Apple', price: 34999, sku: 'APP2-USB', stock: 20, description: 'Active noise cancellation, spatial audio, USB-C charging' },
  { name: 'Samsung Galaxy Tab S9', category: 'Tablets', price: 94999, sku: 'SGTS9-128', stock: 9, description: '11" Dynamic AMOLED 2X, Snapdragon 8 Gen 2, S Pen included' },
  { name: 'iPad Air M2', category: 'Tablets', price: 94999, sku: 'IPDA-M2-128', stock: 8, description: '11" Liquid Retina, M2 chip, Apple Pencil support' },
  { name: 'Sony WH-1000XM5', category: 'Audio', price: 49999, sku: 'SNYXM5-BLK', stock: 11, description: 'Industry-leading noise canceling, 30-hour battery, premium comfort' },
  { name: 'Anker Soundcore Liberty 4 NC', category: 'Audio', price: 12999, sku: 'ANK-L4NC', stock: 25, description: 'Adaptive active noise cancelling, 10-hour battery, wireless earbuds' },
  { name: 'Razer BlackShark V2 Pro', category: 'Gaming', price: 24999, sku: 'RBV2P-XBX', stock: 14, description: 'Wireless gaming headset, THX 7.1 surround sound, 24-hour battery' },
  { name: 'Xbox Wireless Controller', category: 'Gaming', price: 16999, sku: 'XBX-CTRL-BLK', stock: 18, description: 'Ergonomic wireless controller for Xbox and PC' },
  { name: 'Rode Wireless GO II', category: 'Content Creator Kit', price: 39999, sku: 'RODE-WG2', stock: 10, description: 'Dual-channel wireless microphone system with onboard recording' },
  { name: 'Ulanzi 18" RGB Ring Light', category: 'Content Creator Kit', price: 8999, sku: 'ULZ-RGB18', stock: 16, description: 'Adjustable color temperature, phone mount, tripod compatible' },
  { name: 'Anker 65W GaN Charger', category: 'Mobile Accessories', price: 4999, sku: 'ANK-65W-GAN', stock: 30, description: 'Compact 65W USB-C charger, powers laptop, phone and accessories' },
  { name: 'Spigen Tough Armor Case', category: 'Mobile Accessories', price: 2499, sku: 'SPG-TA-UNI', stock: 40, description: 'Dual-layer shock absorption phone case with built-in kickstand' },
  { name: 'Belkin MagSafe 3-in-1 Charger', category: 'Mobile Accessories', price: 12999, sku: 'BLK-M3W', stock: 13, description: 'Wireless charging stand for iPhone, Apple Watch and AirPods' }
];

async function login(page) {
  console.log('Logging in via sign-up page...');
  await page.goto('https://aliciastorephone.go.scalenodes.app/sign-up', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // If already logged in, redirect will happen to dashboard
  if (page.url().includes('/dashboard')) {
    console.log('Already logged in via signup redirect.');
    return;
  }

  // Click Sign In
  const signInLink = page.locator('a:has-text("Sign In")');
  if (await signInLink.isVisible().catch(() => false)) {
    await signInLink.click();
    await page.waitForTimeout(2000);
  }
  
  // Wait for email input
  await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('Logged in:', page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    await login(page);

    // Get category IDs for dropdown
    console.log('Fetching categories...');
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/categories', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const categoryMap = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr, [class*="category"]');
      const map = {};
      document.querySelectorAll('a, div, span').forEach(el => {
        const text = el.textContent?.trim();
        if (text && !map[text]) {
          // try to find a parent link with href containing category UUID
          const link = el.closest('a');
          if (link && link.href?.includes('/categories/')) {
            const match = link.href.match(/\/categories\/([a-z0-9-]+)/i);
            if (match) map[text] = match[1];
          }
        }
      });
      return map;
    });
    console.log('Categories found:', categoryMap);

    // Navigate to add product
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.click('a:has-text("New product")');
    await page.waitForTimeout(5000);
    
    if (!page.url().includes('/products/add')) {
      await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products/add', { waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);
    }
    console.log('Add product URL:', page.url());

    // Wait for the form to hydrate
    await page.waitForFunction(() => document.querySelectorAll('input, select, textarea').length > 5, { timeout: 30000 });
    await page.screenshot({ path: `${outDir}/product-add-start.png` });

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        console.log(`Adding ${i + 1}/${products.length}: ${p.name}`);
        
        // Refresh form for subsequent products
        if (i > 0) {
          await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products/add', { waitUntil: 'networkidle' });
          await page.waitForTimeout(4000);
          await page.waitForFunction(() => document.querySelectorAll('input, select, textarea').length > 5, { timeout: 30000 });
        }

        // Fill name
        await page.locator('input[type="text"]').first().fill(p.name);
        
        // Find description textarea and fill
        const desc = await page.locator('textarea').first();
        await desc.fill(p.description);
        
        // Fill price
        const priceInput = await page.locator('input[type="number"]').first();
        await priceInput.fill(String(p.price));
        
        // Fill SKU
        const skuInput = await page.locator('input[name*="sku" i], input[placeholder*="SKU" i]').first();
        if (await skuInput.isVisible().catch(() => false)) await skuInput.fill(p.sku);
        
        // Stock
        const stockInput = await page.locator('input[type="number"]').nth(1);
        if (await stockInput.isVisible().catch(() => false)) await stockInput.fill(String(p.stock));

        // Category select - if exists
        const categorySelect = await page.locator('select').first();
        if (await categorySelect.isVisible().catch(() => false)) {
          const options = await categorySelect.locator('option').allInnerTexts();
          const optionToSelect = options.find(o => o.toLowerCase().includes(p.category.toLowerCase())) || options[1];
          if (optionToSelect) await categorySelect.selectOption({ label: optionToSelect });
        }

        // Click save/add
        const saveButton = await page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Publish"), button:has-text("Add product")').first();
        await saveButton.click();
        
        await page.waitForTimeout(3000);
        console.log(`  Added ${p.name}`);
      } catch (err) {
        console.error(`  Failed ${p.name}:`, err.message);
        await page.screenshot({ path: `${outDir}/product-error-${i}.png` });
      }
    }

    console.log('Done adding products.');
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${outDir}/products-final.png` });

  } catch (err) {
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${outDir}/product-fatal.png` });
    fs.writeFileSync(`${outDir}/product-fatal.html`, await page.content());
  } finally {
    await browser.close();
  }
})();
