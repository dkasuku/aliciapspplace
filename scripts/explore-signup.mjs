import { chromium } from 'playwright';
import fs from 'fs';

const outDir = 'tmp';
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  console.log('Loading sign-up page...');
  await page.goto('https://aliciastorephone.go.scalenodes.app/sign-up', { waitUntil: 'networkidle' });
  
  // Wait for hydration
  await page.waitForFunction(() => document.querySelectorAll('input').length > 1);
  
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      placeholder: i.placeholder,
      required: i.required
    }));
    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent?.trim(),
      type: b.type,
      class: b.className
    }));
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim(),
      href: a.getAttribute('href')
    }));
    return { url: window.location.href, inputs, buttons, links };
  });

  fs.writeFileSync(`${outDir}/signup-info.json`, JSON.stringify(info, null, 2));
  await page.screenshot({ path: `${outDir}/signup-hydrated.png` });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
