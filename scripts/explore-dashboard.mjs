import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const email = process.env.DASHBOARD_EMAIL;
const password = process.env.DASHBOARD_PASSWORD;
const baseUrl = 'https://aliciastorephone.go.scalenodes.app';

if (!email || !password) {
  console.error('Set DASHBOARD_EMAIL and DASHBOARD_PASSWORD env vars');
  process.exit(1);
}

const outDir = 'tmp';
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    console.log('Navigating to login...');
    await page.goto(`${baseUrl}/login`);
    await page.screenshot({ path: `${outDir}/login.png` });
    fs.writeFileSync(`${outDir}/login.html`, await page.content());

    console.log('Filling credentials...');
    await page.fill('input[type="email"], input[name="email"], input[name="identity"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.screenshot({ path: `${outDir}/login-filled.png` });

    console.log('Clicking login...');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${outDir}/after-login.png` });
    fs.writeFileSync(`${outDir}/after-login.html`, await page.content());

    console.log('Current URL:', page.url());

    // Look for products/categories links
    const links = await page.$$eval('a, button', els =>
      els.map(e => ({ tag: e.tagName, text: e.textContent?.trim(), href: e.getAttribute('href'), class: e.className }))
        .filter(e => /product|category|categori|item|catalog/i.test(e.text))
    );
    fs.writeFileSync(`${outDir}/relevant-links.json`, JSON.stringify(links, null, 2));
    console.log('Relevant links/buttons:', JSON.stringify(links, null, 2));

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: `${outDir}/dashboard.png` });
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/error.png` });
    fs.writeFileSync(`${outDir}/error.html`, await page.content());
  } finally {
    console.log('Done. Check tmp/ for screenshots.');
    // Keep browser open for 10s so you can see
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
  }
})();
