import { chromium } from 'playwright';

// DS-12 browser proof — the SELLER freshness screen (MENU-01 destination
// « Fraîcheur de la dispo », the write half of SEARCH-02/D-03).
//
// The screen only renders with a seller session, and real Neon sign-in is
// unavailable to this harness. Exactly like the DS-8/DS-3 proofs, we stub ONLY
// the auth + API boundary (get-session, /token, account context, seller
// catalogue) so the app, the menu, the sheet and the real re-confirm call are
// the production ones. The falsifiable assertion is that clicking
// « Reconfirmer maintenant » issues the real POST to
// /api/v2/seller/catalogue/:id/availability with to=en_stock and the chosen
// window — the route that had NO UI caller before DS-12.
const BASE = process.env.APP_URL || 'http://localhost:4181';

const browser = await chromium.launch({ headless: true });
let failures = 0;
const check = (ok, label, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`); if (!ok) failures += 1; };

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));

const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' };
await page.route('**/auth/get-session', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ user: { id: 'proof-seller', email: 'demo@seller.omni', name: 'Demo Seller' }, session: { user: { id: 'proof-seller' } } }),
}));
await page.route('**/auth/token', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }),
}));
await page.route('**/api/v2/account/context', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ ok: true, data: {
    accountId: 'acct-1', roles: ['seller'], onboardingState: 'seller_ready', suspended: false,
    facilityCount: 1, ownedFacilityIds: ['facility-1'],
    capabilities: { sellerWorkspace: true, operatorTools: false, reviewerWorkspace: false, adminTools: false },
  } }),
}));
await page.route('**/api/v2/seller/availability-requests*', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ ok: true, data: { requests: [] } }),
}));
await page.route('**/api/v2/seller/catalogue', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ ok: true, data: {
    authorized: true, catalogReady: true,
    facilities: [{ id: 'facility-1', name: 'Omni Demo Seller Hub', category: 'Marché', address: null, currency: 'XOF', slotState: 'active', operationalState: 'ouvert', productCount: 1, facilityType: 'fixe', rayonKm: null, trustState: 'confirmed', contactPhone: null, contactWhatsapp: null }],
    products: [{
      id: '11111111-1111-1111-1111-111111111111', entityId: 'e1', entityName: 'Demo', facilityId: 'facility-1', facilityName: 'Omni Demo Seller Hub',
      name: 'Box déjeuner togolais', description: 'Plat chaud du jour', unit: 'plat', currency: 'XOF',
      stockLoueOmni: 5, prixOriginal: 1000, prixReduit: 800, pourcentageReduction: 20,
      publicationState: 'published', availabilityState: 'a_valider', availabilityExpiresAt: null, availabilityProEligible: true,
      positionKind: 'fixe', uniquenessKind: 'renouvelable', handoverKind: 'retrait', priceKind: 'fixe', conditionKind: 'neuf', media: [{ url: 'https://x/y.png', kind: 'image' }],
    }],
  } }),
}));

let availabilityPost = null;
await page.route('**/api/v2/seller/catalogue/*/availability', (route) => {
  availabilityPost = route.request().postDataJSON();
  route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ ok: true, data: { productId: '11111111-1111-1111-1111-111111111111', availabilityState: 'en_stock', previousState: 'a_valider' } }) });
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.navpill button', { timeout: 15000 });
await page.waitForTimeout(1500);

// Switch to the seller role via the real role pill.
await page.evaluate(() => { const b = [...document.querySelectorAll('.rolepill button')].find((x) => /Vendeur/.test(x.textContent || '')); b?.click(); });
await page.waitForTimeout(900);

// Open the seller menu, then the « Fraîcheur de la dispo » destination.
await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Menu/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
await page.waitForTimeout(700);
const menuHasFreshness = await page.evaluate(() => [...document.querySelectorAll('[data-sheet="menu"] .menuitem b')].some((b) => /Fraîcheur de la dispo/.test(b.textContent || '')));
check(menuHasFreshness, 'the seller menu carries « Fraîcheur de la dispo »');
await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="menu"] .menuitem')].find((x) => /Fraîcheur de la dispo/.test(x.textContent || '')); b?.click(); });
await page.waitForTimeout(900);

const stage = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
check(stage === 'freshness', 'the freshness sheet opens (data-sheet=freshness)', stage || 'none');
const body = await page.evaluate(() => document.querySelector('[data-sheet="freshness"]')?.textContent || '');
check(body.includes('4 h frais · 24 h expiré'), 'names the freshness threshold');
check(body.includes('Reconfirmer maintenant'), 'offers the maquette « Reconfirmer maintenant » action');
check(body.includes('Box déjeuner togolais'), 'lists the published offer');
check(body.includes('Non confirmée') || body.includes('À confirmer'), 'shows a derived badge, never a false « En stock »');
check(!body.includes('En stock'), 'a never-declared-live offer is not shown « En stock »');

// The falsifiable core: re-confirm fires the REAL Pro-gated route.
await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="freshness"] button')].find((x) => /Reconfirmer/.test(x.textContent || '')); b?.click(); });
await page.waitForTimeout(1200);
check(availabilityPost !== null, 'clicking Reconfirmer issues POST /seller/catalogue/:id/availability');
check(availabilityPost?.to === 'en_stock', 'the write declares a LIVE availability (to=en_stock)', JSON.stringify(availabilityPost));
check(availabilityPost?.expiresInHours === 4, 'the write carries the chosen freshness window (4 h)', String(availabilityPost?.expiresInHours));

check(errs.length === 0, 'no page error during the flow', errs.slice(0, 3).join(' | '));

await browser.close();
console.log(failures === 0 ? '\nDS-12 PROOF: PASS' : `\nDS-12 PROOF: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
