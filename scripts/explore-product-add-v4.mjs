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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Start fresh login
    await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
    await page.waitForSelector('input#email', { timeout: 10000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Navigate to products list
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.waitForSelector('a:has-text("New product")', { timeout: 10000 });

    console.log('Clicking New product from products list...');
    await page.click('a:has-text("New product")');
    await page.waitForTimeout(5000);

    console.log('Current URL:', page.url());
    await page.screenshot({ path: `${outDir}/product-add-page-v4.png` });
    fs.writeFileSync(`${outDir}/product-add-page-v4.html`, await page.content());

    // Wait for inputs
    await page.waitForFunction(() => document.querySelectorAll('input, select, textarea').length > 3, { timeout: 30000 });

    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, select, textarea')).map((i, idx) => ({
        idx,
        tag: i.tagName,
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder,
        value: i.value,
        required: i.required,
        label: i.labels?.[0]?.textContent?.trim() ||
               i.parentElement?.querySelector('label')?.textContent?.trim() ||
               i.previousElementSibling?.textContent?.trim(),
        textAround: i.parentElement?.textContent?.trim().substring(0, 120)
      }));
    });
    fs.writeFileSync(`${outDir}/product-add-inputs-v4.json`, JSON.stringify(inputs, null, 2));
    console.log('Inputs:', JSON.stringify(inputs, null, 2));

    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        class: b.className
      })).filter(b => /save|create|add|publish|draft|cancel/i.test(b.text));
    });
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/product-add-v4-error.png` });
    fs.writeFileSync(`${outDir}/product-add-v4-error.html`, await page.content());
  } finally {
    await browser.close();
  }
})();
