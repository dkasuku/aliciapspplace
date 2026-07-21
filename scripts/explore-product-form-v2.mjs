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

async function login(page) {
  await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
  // Wait for either email input or redirect to dashboard
  const emailInput = await page.locator('input#email').first();
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    // Already logged in?
    if (page.url().includes('/dashboard')) return;
    throw new Error('Login form not found');
  }
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    console.log('Logging in...');
    await login(page);

    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${outDir}/products-page.png` });

    console.log('Clicking New Product...');
    await page.click('button:has-text("New Product")');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${outDir}/product-modal.png` });
    fs.writeFileSync(`${outDir}/product-modal.html`, await page.content());

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
        closestText: i.closest('div, section, fieldset')?.textContent?.trim().substring(0, 120)
      }));
    });
    fs.writeFileSync(`${outDir}/product-modal-inputs.json`, JSON.stringify(inputs, null, 2));
    console.log('Inputs:', JSON.stringify(inputs.slice(0, 60), null, 2));

    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        class: b.className
      })).filter(b => /save|create|next|cancel|add|continue/i.test(b.text));
    });
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/product-modal-error.png` });
    fs.writeFileSync(`${outDir}/product-modal-error.html`, await page.content());
  } finally {
    await browser.close();
  }
})();
