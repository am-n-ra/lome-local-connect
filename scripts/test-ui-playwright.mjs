import { chromium } from 'playwright';
import fs from 'fs';

async function runTest() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  fs.mkdirSync('./screenshots', { recursive: true });

  // 1. Initial Live Home View (Buyer Mode with Floating Header, Result Carousel, and Search Dock)
  await page.screenshot({ path: './screenshots/01-live-home-screen.png' });
  console.log('Saved 01-live-home-screen.png');

  // 2. Click a Category Filter pill
  const categoryPill = page.locator('button:has-text("Électronique")').first();
  if (await categoryPill.isVisible()) {
    console.log('Clicking category filter pill...');
    await categoryPill.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './screenshots/02-category-filter-active.png' });
  }

  // 3. Open Showcase mode by clicking "Mode Showcase"
  const showcaseBtn = page.locator('button:has-text("Mode Showcase")').first();
  if (await showcaseBtn.isVisible()) {
    console.log('Opening Liquid Showcase...');
    await showcaseBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './screenshots/03-showcase-active.png' });

    // 4. Test B06 Fiche & Panier
    const ficheBtn = page.locator('button:has-text("B06 Fiche & Panier")').first();
    if (await ficheBtn.isVisible()) {
      await ficheBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: './screenshots/04-facility-sheet-liquid.png' });

      // Close facility sheet by clicking its backdrop or handle
      const sheetBackdrop = page.locator('#liquid-facility-sheet-backdrop').first();
      if (await sheetBackdrop.isVisible()) {
        await sheetBackdrop.click({ position: { x: 10, y: 10 }, force: true });
        await page.waitForTimeout(500);
      }
    }

    // 5. Test B13 QR Room
    const qrRoomBtn = page.locator('button:has-text("B13 QR Room")').first();
    if (await qrRoomBtn.isVisible()) {
      await qrRoomBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: './screenshots/05-transaction-qr-room.png' });
      
      const closeBtn = page.locator('button:has-text("Fermer")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    }

    // 6. Test S01 Seller Cockpit
    const sellerCockpitBtn = page.locator('button:has-text("S01 Cockpit Vendeur")').first();
    if (await sellerCockpitBtn.isVisible()) {
      await sellerCockpitBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: './screenshots/06-seller-cockpit.png' });

      const stockTab = page.locator('button:has-text("Stock Alloué Omni")').first();
      if (await stockTab.isVisible()) {
        await stockTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: './screenshots/07-seller-cockpit-stock.png' });
      }

      const scannerTab = page.locator('button:has-text("Scanner QR")').first();
      if (await scannerTab.isVisible()) {
        await scannerTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: './screenshots/08-seller-cockpit-scanner.png' });
      }

      // Close seller cockpit
      const cockpitBackdrop = page.locator('#liquid-seller-cockpit-backdrop').first();
      if (await cockpitBackdrop.isVisible()) {
        await cockpitBackdrop.click({ position: { x: 10, y: 10 }, force: true });
        await page.waitForTimeout(500);
      }
    }
  }

  // 7. Test Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './screenshots/09-mobile-liquid-view.png' });
  console.log('Saved 09-mobile-liquid-view.png');

  await browser.close();
  console.log('All Playwright UI tests finished successfully!');
}

runTest().catch((err) => {
  console.error('Playwright error:', err);
  process.exit(1);
});
