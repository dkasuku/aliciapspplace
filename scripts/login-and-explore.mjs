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
    console.log('Loading login page...');
    await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('input#email') !== null);

    console.log('Filling login...');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.screenshot({ path: `${outDir}/login-form.png` });

    console.log('Clicking login...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${outDir}/after-submit.png` });
    console.log('Current URL:', page.url());

    // Wait for dashboard to load
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${outDir}/dashboard-logged-in.png` });
    fs.writeFileSync(`${outDir}/dashboard-logged-in.html`, await page.content());

    // Find navigation links
    const nav = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button')).map(e => ({
        tag: e.tagName,
        text: e.textContent?.trim(),
        href: e.getAttribute('href'),
        class: e.className
      })).filter(e => /product|categor|catalog|item|inventory|store|setting/i.test(e.text || ''));
      return { url: window.location.href, links };
    });
    fs.writeFileSync(`${outDir}/dashboard-nav.json`, JSON.stringify(nav, null, 2));
    console.log('Nav items:', JSON.stringify(nav.links, null, 2));

    // Try to find any link with /products, /categories, /catalog
    const possible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter(h => h && /product|categor|catalog|item|inventory/i.test(h));
    });
    console.log('Possible routes:', possible);

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/login-error.png` });
    fs.writeFileSync(`${outDir}/login-error.html`, await page.content());
  } finally {
    console.log('Done.');
    await browser.close();
  }
})();
