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

async function ensureLoggedIn(page) {
  await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products/add', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  if (page.url().includes('/login') || page.url() === 'https://aliciastorephone.go.scalenodes.app/' || page.url().includes('/sign-up')) {
    console.log('Not logged in. Logging in...');
    await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
    await page.waitForSelector('input#email', { timeout: 10000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products/add', { waitUntil: 'networkidle' });
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    await ensureLoggedIn(page);
    console.log('URL:', page.url());

    // Wait for form inputs to hydrate
    console.log('Waiting for form to hydrate...');
    await page.waitForFunction(() => document.querySelectorAll('input, select, textarea').length > 3, { timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}/product-add-page-v3.png` });
    fs.writeFileSync(`${outDir}/product-add-page-v3.html`, await page.content());

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
        textAround: i.parentElement?.textContent?.trim().substring(0, 150)
      }));
    });
    fs.writeFileSync(`${outDir}/product-add-inputs-v3.json`, JSON.stringify(inputs, null, 2));
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
    await page.screenshot({ path: `${outDir}/product-add-v3-error.png` });
    fs.writeFileSync(`${outDir}/product-add-v3-error.html`, await page.content());
  } finally {
    await browser.close();
  }
})();
