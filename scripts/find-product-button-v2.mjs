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
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${outDir}/products-page-v2.png` });

    // Look for any clickable element containing relevant text
    const elements = await page.evaluate(() => {
      const all = [];
      document.querySelectorAll('button, a, [role="button"]').forEach((el, idx) => {
        const text = el.textContent?.trim() || '';
        if (/product|add|create|new|import|upload|first/i.test(text)) {
          all.push({
            idx,
            tag: el.tagName,
            text: text.substring(0, 200),
            ariaLabel: el.getAttribute('aria-label'),
            class: el.className?.substring(0, 120),
            href: el.getAttribute('href'),
            visible: el.offsetParent !== null
          });
        }
      });
      return all;
    });
    fs.writeFileSync(`${outDir}/product-relevant-elements.json`, JSON.stringify(elements, null, 2));
    console.log(JSON.stringify(elements, null, 2));

    // Also dump main content text
    const mainText = await page.evaluate(() => {
      return document.body.innerText?.substring(0, 2000) || '';
    });
    fs.writeFileSync(`${outDir}/products-page-text.txt`, mainText);
    console.log('Page text:', mainText);

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/products-page-v2-error.png` });
  } finally {
    await browser.close();
  }
})();
