import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:3000';

async function runE2ETests() {
  console.log(`🚀 Starting Comprehensive Playwright E2E Test Suite on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const errors = [];
  const logError = (context, msg) => {
    console.error(`❌ [${context}] ${msg}`);
    errors.push({ context, msg });
  };

  try {
    // ------------------------------------------------------------------------
    // 📱 1. MOBILE VIEWPORT TEST (390x844)
    // ------------------------------------------------------------------------
    console.log('\n--- 📱 1. Testing Mobile Viewport (390x844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await mobileContext.newPage();

    page.on('pageerror', (err) => logError('Mobile PageError', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logError('Mobile ConsoleError', msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(800);

    const title = await page.title();
    console.log(`Page Title: "${title}"`);

    // A. Map Stage
    const stage = page.locator('.map-stage').first();
    if (await stage.isVisible().catch(() => false)) {
      console.log('✅ Map stage mounted and visible');
    }

    // B. Search Dock
    const searchInput = page.locator('.search-anchor input').first();
    if (await searchInput.isVisible().catch(() => false)) {
      console.log('✅ Search Dock input visible');
    } else {
      logError('SearchDock', 'Search dock input not found');
    }

    // Helper to ensure menu is open
    const ensureMenuOpen = async () => {
      const menuPanel = page.locator('#omni-menu').first();
      if (!(await menuPanel.isVisible().catch(() => false))) {
        const menuBtn = page.locator('.menu-icon').first();
        await menuBtn.click();
        await page.waitForTimeout(300);
      }
    };

    // C. Test Menu Options
    console.log('Opening Omni Menu...');
    await ensureMenuOpen();
    const menuPanel = page.locator('#omni-menu').first();

    if (await menuPanel.isVisible()) {
      console.log('✅ Omni Menu opened');

      // 1. Guide de découverte Modal
      console.log('Testing Guide de découverte...');
      const guideBtn = page.locator('#omni-menu button:has-text("Guide de découverte")').first();
      if (await guideBtn.isVisible()) {
        await guideBtn.click();
        await page.waitForTimeout(400);

        const onboarding = page.locator('.onboarding-sheet').first();
        if (await onboarding.isVisible()) {
          console.log('✅ Onboarding Sheet opened');
          const closeBtn = onboarding.locator('.skip-button, button:has-text("Passer")').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        } else {
          logError('OnboardingModal', 'Onboarding sheet failed to open');
        }
      }

      // 2. Créer une compagnie / point de vente
      console.log('Testing Company Facility Onboarding...');
      await ensureMenuOpen();
      const companyBtn = page.locator('#omni-menu button:has-text("Créer une compagnie")').first();
      if (await companyBtn.isVisible()) {
        await companyBtn.click();
        await page.waitForTimeout(400);

        const companySheet = page.locator('.company-onboarding-sheet').first();
        if (await companySheet.isVisible()) {
          console.log('✅ Company Onboarding Sheet opened');

          // Fill company name & advance
          const nameInput = companySheet.locator('input[placeholder*="Pharmacie"]').first();
          await nameInput.fill('Pharmacie de Test E2E');
          const nextBtn = companySheet.locator('button:has-text("Continuer vers le point de vente")').first();
          await nextBtn.click();
          await page.waitForTimeout(400);

          const step2Input = companySheet.locator('input[placeholder*="Agence"]').first();
          if (await step2Input.isVisible()) {
            console.log('✅ Company Onboarding Step 2 reached');
          } else {
            logError('CompanyOnboarding', 'Step 2 failed to render');
          }

          const closeBtn = companySheet.locator('.sheet-head button[aria-label="Fermer"]').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        } else {
          logError('CompanyOnboarding', 'Company sheet failed to open');
        }
      }

      // 3. Scanner QR Vendeur
      console.log('Testing Seller Scanner Modal...');
      await ensureMenuOpen();
      const scannerMenuBtn = page.locator('#omni-menu button:has-text("Scanner un QR client")').first();
      if (await scannerMenuBtn.isVisible()) {
        await scannerMenuBtn.click();
        await page.waitForTimeout(400);

        const scannerSheet = page.locator('.seller-scanner-sheet').first();
        if (await scannerSheet.isVisible()) {
          console.log('✅ Seller Scanner Modal opened');

          // Simulate QR Scan
          const simBtn = scannerSheet.locator('button:has-text("Simuler le scan QR")').first();
          if (await simBtn.isVisible()) {
            await simBtn.click();
            await page.waitForTimeout(400);
            const success = scannerSheet.locator('.seller-response-success').first();
            if (await success.isVisible()) {
              console.log('✅ QR scan simulated successfully');
            }
          }

          const closeBtn = scannerSheet.locator('.sheet-head button[aria-label="Fermer"]').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        } else {
          logError('SellerScanner', 'Scanner sheet failed to open');
        }
      }

      // Close menu if open
      if (await menuPanel.isVisible()) {
        const menuClose = page.locator('.menu-brand button[aria-label="Fermer le menu"]').first();
        if (await menuClose.isVisible()) {
          await menuClose.click();
          await page.waitForTimeout(300);
        }
      }
    } else {
      logError('OmniMenu', 'Menu panel failed to display');
    }

    // D. Search and Facility Selection
    console.log('\nTesting Search and Facility Sheet...');
    await searchInput.fill('Pharmacie');
    await page.waitForTimeout(500);

    const resultCard = page.locator('.v3-facility-card, .nearby-facility-card').first();
    if (await resultCard.isVisible().catch(() => false)) {
      console.log('✅ Search result facility card visible');
      await resultCard.click();
      await page.waitForTimeout(500);

      const contextPanel = page.locator('.context-panel, .facility-sheet').first();
      if (await contextPanel.isVisible().catch(() => false)) {
        console.log('✅ Facility Context Panel opened');
      }
    }

    await mobileContext.close();

    // ------------------------------------------------------------------------
    // 💻 2. DESKTOP VIEWPORT TEST (1280x800)
    // ------------------------------------------------------------------------
    console.log('\n--- 💻 2. Testing Desktop Viewport (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();

    desktopPage.on('pageerror', (err) => logError('Desktop PageError', err.message));
    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        logError('Desktop ConsoleError', msg.text());
      }
    });

    await desktopPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await desktopPage.waitForTimeout(800);

    const dTitle = await desktopPage.title();
    console.log(`Desktop Page Title: "${dTitle}"`);

    const dDock = desktopPage.locator('.search-anchor').first();
    if (await dDock.isVisible().catch(() => false)) {
      console.log('✅ Desktop Search Dock visible');
    }

    await desktopContext.close();

  } catch (err) {
    logError('UncaughtException', err.stack || err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== E2E PLAYWRIGHT TEST SUMMARY ===');
  if (errors.length === 0) {
    console.log('🎉 ALL E2E PLAYWRIGHT TESTS PASSED WITH 0 ERRORS!');
  } else {
    console.error(`💥 ENCOUNTERED ${errors.length} ISSUES:`);
    errors.forEach((e, idx) => console.error(`${idx + 1}. [${e.context}] ${e.msg}`));
    process.exit(1);
  }
}

runE2ETests();
