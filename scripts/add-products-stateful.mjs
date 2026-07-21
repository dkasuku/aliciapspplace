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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Try dashboard directly first
    console.log('Checking if already logged in...');
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());

    // If on login page, fill it
    if (page.url().includes('/sign-up') || page.url() === 'https://aliciastorephone.go.scalenodes.app/' || page.url().includes('/login')) {
      console.log('Need to log in...');
      const emailInput = page.locator('input#email');
      const isLogin = await emailInput.isVisible().catch(() => false);
      
      if (isLogin) {
        await emailInput.fill(email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
      } else if (page.url().includes('/sign-up')) {
        // Click sign in link
        await page.click('a:has-text("Sign In")');
        await page.waitForTimeout(3000);
        await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
        await page.fill('#email', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
      }
    } else {
      console.log('Already logged in.');
    }

    // Now navigate to products add
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products/add', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    console.log('Add product URL:', page.url());

    // Wait for form inputs to appear
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      return inputs.length > 5;
    }, { timeout: 30000 });

    // Take screenshot for analysis
    await page.screenshot({ path: `${outDir}/product-add-start.png` });
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, select, textarea')).map((i, idx) => ({
        idx,
        tag: i.tagName,
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder,
        label: i.labels?.[0]?.textContent?.trim() ||
               i.parentElement?.querySelector('label')?.textContent?.trim() ||
               i.previousElementSibling?.textContent?.trim()
      }));
    });
    fs.writeFileSync(`${outDir}/product-add-start-inputs.json`, JSON.stringify(inputs, null, 2));
    console.log('Form inputs:', JSON.stringify(inputs, null, 2));

    // Try to add first product to test
    if (inputs.length === 0) {
      throw new Error('No form inputs found');
    }

    const p = products[0];
    console.log(`Testing with product: ${p.name}`);

    // Fill all text inputs with heuristics
    const textInputs = await page.locator('input[type="text"]').all();
    if (textInputs[0]) await textInputs[0].fill(p.name);
    if (textInputs[1]) await textInputs[1].fill(p.sku);

    const numberInputs = await page.locator('input[type="number"]').all();
    if (numberInputs[0]) await numberInputs[0].fill(String(p.price));
    if (numberInputs[1]) await numberInputs[1].fill(String(p.stock));

    const textareas = await page.locator('textarea').all();
    if (textareas[0]) await textareas[0].fill(p.description);

    const selects = await page.locator('select').all();
    for (const select of selects) {
      const options = await select.locator('option').allInnerTexts();
      const matching = options.find(o => o.toLowerCase().includes(p.category.toLowerCase())) || options[0];
      if (matching) await select.selectOption({ label: matching });
    }

    // Find save button
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Publish"), button:has-text("Add")').first();
    await saveBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${outDir}/product-add-first-result.png` });
    console.log('First product attempted.');

  } catch (err) {
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${outDir}/product-fatal-stateful.png` });
    fs.writeFileSync(`${outDir}/product-fatal-stateful.html`, await page.content());
  } finally {
    await browser.close();
  }
})();
