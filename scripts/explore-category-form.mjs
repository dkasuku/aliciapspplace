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

    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/categories', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Clicking New Category...');
    await page.click('button:has-text("New Category")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}/category-modal.png` });
    fs.writeFileSync(`${outDir}/category-modal.html`, await page.content());

    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
        tag: i.tagName,
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder,
        value: i.value,
        required: i.required,
        label: i.labels?.[0]?.textContent?.trim() ||
               i.parentElement?.querySelector('label')?.textContent?.trim() ||
               i.previousElementSibling?.textContent?.trim()
      }));
    });
    fs.writeFileSync(`${outDir}/category-modal-inputs.json`, JSON.stringify(inputs, null, 2));
    console.log(JSON.stringify(inputs, null, 2));

    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        class: b.className
      })).filter(b => /save|create|cancel/i.test(b.text));
    });
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: `${outDir}/category-modal-error.png` });
  } finally {
    await browser.close();
  }
})();
