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
    await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');

    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a[role="button"]')).map((b, idx) => ({
        idx,
        tag: b.tagName,
        text: b.textContent?.trim(),
        ariaLabel: b.getAttribute('aria-label'),
        class: b.className?.substring(0, 120),
        href: b.getAttribute('href')
      }));
    });
    fs.writeFileSync(`${outDir}/products-page-buttons.json`, JSON.stringify(buttons, null, 2));
    console.log('All buttons/links:', JSON.stringify(buttons, null, 2));

    await page.screenshot({ path: `${outDir}/products-page-full.png` });

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/products-page-error.png` });
  } finally {
    await browser.close();
  }
})();
