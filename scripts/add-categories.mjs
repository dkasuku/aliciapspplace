import { chromium } from 'playwright';
import fs from 'fs';

const email = process.env.DASHBOARD_EMAIL;
const password = process.env.DASHBOARD_PASSWORD;

if (!email || !password) {
  console.error('Set DASHBOARD_EMAIL and DASHBOARD_PASSWORD env vars');
  process.exit(1);
}

const categories = [
  { name: 'Samsung', description: 'Samsung Galaxy smartphones, tablets, and accessories' },
  { name: 'Apple', description: 'iPhone, iPad, MacBook, Apple Watch, and AirPods' },
  { name: 'Smartphones', description: 'All smartphone brands and models' },
  { name: 'Mobile Accessories', description: 'Chargers, power banks, cases, cables, and screen protectors' },
  { name: 'Audio', description: 'Headphones, earbuds, speakers, and audio accessories' },
  { name: 'Gaming', description: 'Gaming headsets, controllers, mice, keyboards, and accessories' },
  { name: 'Tablets', description: 'iPad, Samsung Galaxy Tab, and Android tablets' },
  { name: 'Content Creator Kit', description: 'Microphones, ring lights, tripods, SSDs, and webcams' }
];

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
    console.log('Logged in.');

    await page.goto('https://aliciastorephone.go.scalenodes.app/dashboard/listing/categories', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    for (const cat of categories) {
      try {
        console.log(`Creating category: ${cat.name}`);
        await page.click('button:has-text("New Category")');
        await page.waitForTimeout(500);
        
        // Fill the form - use inputs by their names
        const nameInput = await page.locator('input[placeholder="e.g., Jackets"]').first();
        await nameInput.fill(cat.name);
        
        const descInput = await page.locator('textarea[placeholder*="Describe what products"]').first();
        await descInput.fill(cat.description);
        
        await page.click('button:has-text("Create category")');
        await page.waitForTimeout(1500);
        
        // Close any success toast or wait for modal to disappear
        const modal = await page.locator('button:has-text("Create category")').isVisible().catch(() => false);
        if (modal) {
          // maybe an error, take screenshot
          console.warn(`  Modal still visible for ${cat.name}`);
        } else {
          console.log(`  Created ${cat.name}`);
        }
      } catch (err) {
        console.error(`  Failed to create ${cat.name}:`, err.message);
      }
    }

    console.log('Categories added. Screenshotting...');
    await page.screenshot({ path: 'tmp/categories-after.png' });

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'tmp/categories-error.png' });
  } finally {
    await browser.close();
  }
})();
