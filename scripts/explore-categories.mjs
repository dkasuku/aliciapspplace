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
  page.setDefaultTimeout(30000);

  try {
    console.log('Logging in...');
    await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');

    console.log('Navigating to categories...');
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/categories', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${outDir}/categories-page.png` });
    fs.writeFileSync(`${outDir}/categories-page.html`, await page.content());

    // Find add button
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        class: b.className
      })).filter(b => /add|create|new/i.test(b.text));
    });
    fs.writeFileSync(`${outDir}/category-buttons.json`, JSON.stringify(buttons, null, 2));
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
        tag: i.tagName,
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder,
        required: i.required
      }));
    });
    fs.writeFileSync(`${outDir}/category-inputs.json`, JSON.stringify(inputs, null, 2));
    console.log('Inputs:', JSON.stringify(inputs.slice(0, 20), null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/categories-error.png` });
    fs.writeFileSync(`${outDir}/categories-error.html`, await page.content());
  } finally {
    await browser.close();
  }
})();
