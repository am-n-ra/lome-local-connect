import { chromium } from 'playwright';

/**
 * BRANCHES-SELLER-MENU proof — the SELLER menu no longer separates what the maquette joins,
 * nor duplicates a destination. Runs on real prod with the real demo seller.
 *
 * Maquette authority: `omni-species-v2-interactive.html` l.762 — « Mes offres · catalogue &
 * prix » (one concept), « Portefeuille & Plans » (one concept), « Fiche de l'entité ».
 */
const PROD = 'https://omni.sparkafrika.online';
const AUTH = 'https://ep-plain-butterfly-amn21o8h.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth';
let pass = 0, fail = 0;
const step = (n, ok, d = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ' :: ' + d : ''}`); ok ? pass++ : fail++; };

const res = await fetch(`${AUTH}/sign-in/email`, { method: 'POST', headers: { 'content-type': 'application/json', Origin: PROD }, body: JSON.stringify({ email: 'demo@seller.omni', password: 'Omni@2026' }) });
const raw = res.headers.getSetCookie?.() ?? [];
step('sign-in demo@seller.omni', res.ok && raw.length > 0, `status=${res.status} cookies=${raw.length}`);

const authHost = new URL(AUTH).hostname;
const cookies = raw.map((c) => {
  const [pair, ...attrs] = c.split(';').map((s) => s.trim());
  const [name, ...v] = pair.split('=');
  return { name, value: v.join('='), domain: authHost, path: '/', secure: true, httpOnly: attrs.some((a) => /^httponly$/i.test(a)), sameSite: 'None' };
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies(cookies);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

try {
  await page.goto(PROD, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);

  // Passer en vendeur puis ouvrir le menu (≡).
  const sellerPill = page.locator('.rolepill button', { hasText: /vendeur/i }).first();
  if (await sellerPill.count()) { await sellerPill.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(2500); }
  await page.locator('.navpill button', { hasText: /menu/i }).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const menuText = await page.locator('section[data-sheet="menu"]').innerText();
  const items = await page.locator('section[data-sheet="menu"] button.menuitem').allInnerTexts();
  const labels = items.map((t) => t.split('\n')[0].trim());

  step('plus d’entrée « Offres » séparée', !labels.includes('Offres'), JSON.stringify(labels.filter((l) => /offre/i.test(l))));
  step('plus d’entrée « Produits & stock »', !labels.some((l) => /Produits & stock/i.test(l)));
  step('« Mes offres » présent (catalogue & prix)', labels.includes('Mes offres') && /catalogue & prix/i.test(menuText));
  step('« Portefeuille & Plans » fusionné', labels.includes('Portefeuille & Plans') && !labels.includes('Plans'));
  step('plus de libellé « Compagnies »', !/Compagnies/.test(menuText) && labels.includes('Fiche de l’entité'));
  step('« Transactions » ne duplique plus « Mon espace »', !labels.includes('Transactions'));

  // « Mes offres » ouvre bien le CATALOGUE (data-sheet=products), pas le dashboard.
  await page.locator('section[data-sheet="menu"] button.menuitem', { hasText: 'Mes offres' }).first().click({ timeout: 8000 });
  await page.waitForTimeout(3000);
  const productsVisible = await page.locator('section[data-sheet="products"]').count();
  step('« Mes offres » ouvre le catalogue (data-sheet=products)', productsVisible > 0);

  // Fiche de l'entité : plus de bouton « Dispo auto » (qui ouvrait « Prix & remise »).
  await page.locator('.navpill button', { hasText: /menu/i }).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('section[data-sheet="menu"] button.menuitem', { hasText: 'Fiche de l’entité' }).first().click({ timeout: 8000 });
  await page.waitForTimeout(2500);
  const company = page.locator('section[data-sheet="company"]');
  const ficheVisible = await company.count();
  if (ficheVisible > 0) {
    const body = await company.innerText();
    step('fiche entité : plus de « Dispo auto »', !/Dispo auto/.test(body));
  } else {
    step('fiche entité atteignable (via menu)', false, 'company sheet introuvable après retour');
  }

  step('aucune erreur console', errors.length === 0, errors.join(' | ').slice(0, 200));
} catch (e) {
  step('proof completed', false, String(e).slice(0, 200));
} finally {
  await browser.close();
}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail === 0 ? 0 : 1);
