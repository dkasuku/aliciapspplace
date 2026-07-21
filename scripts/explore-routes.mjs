import { chromium } from 'playwright';
import fs from 'fs';

const outDir = 'tmp';
fs.mkdirSync(outDir, { recursive: true });

const routes = ['/', '/sign-up', '/login', '/admin', '/auth', '/dashboard', '/app', '/_/'];
const baseUrl = 'https://aliciastorephone.go.scalenodes.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  for (const route of routes) {
    try {
      const url = `${baseUrl}${route}`;
      console.log(`Checking ${url}...`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      const pageUrl = page.url();
      const content = await page.content();
      const status = resp?.status();
      const filename = route.replace(/[^a-z0-9]/gi, '_') || 'root';
      fs.writeFileSync(`${outDir}/${filename}.html`, content);
      await page.screenshot({ path: `${outDir}/${filename}.png` });
      console.log(`  ${route} -> status:${status} title:"${title}" finalURL:${pageUrl}`);
    } catch (err) {
      console.log(`  ${route} -> ERROR: ${err.message}`);
    }
  }

  await browser.close();
})();
