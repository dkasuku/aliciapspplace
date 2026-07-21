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

  const requests = [];
  page.on('request', req => {
    requests.push({ method: req.method(), url: req.url(), type: req.resourceType() });
  });
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // If not logged in, do so
    if (!page.url().includes('/dashboard')) {
      await page.goto('https://aliciastorephone.go.scalenodes.app/', { waitUntil: 'networkidle' });
      await page.waitForSelector('input#email', { timeout: 10000 });
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');
      await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/products', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }

    console.log('Clicking New product...');
    await page.click('a:has-text("New product")');
    await page.waitForTimeout(8000);

    console.log('URL:', page.url());
    fs.writeFileSync(`${outDir}/product-add-network.html`, await page.content());
    await page.screenshot({ path: `${outDir}/product-add-network.png` });

    const apiRequests = requests.filter(r => r.url.includes('aliciastorephone') && (r.url.includes('/pb/') || r.url.includes('/api/')));
    fs.writeFileSync(`${outDir}/product-add-requests.json`, JSON.stringify(apiRequests, null, 2));
    console.log('API requests:', JSON.stringify(apiRequests, null, 2));

    // List all interactive elements again
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
        tag: i.tagName,
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder
      }));
    });
    console.log('Inputs found:', inputs.length, inputs);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
