import { chromium } from 'playwright';

// op-side browser proof — the operator's READ-ONLY entity preview
// (maquette `op-side`, the remaining half of DOCK-02).
//
// The screen only renders with an operator session; real Neon sign-in is
// unavailable to this harness. Exactly like the DS-12/DS-8/DS-3 proofs, we stub
// ONLY the auth + API boundary so the app, the operator dock, the field tour and
// the op-side request are the production ones. The falsifiable assertion is that
// opening a dossier and pressing « Voir ce que voit l'entité » issues the real
// GET /api/v2/public/facilities?reviewer=op-side&visit=<id> and renders the three
// maquette facts (badge · published offers · pending requests).
const BASE = process.env.APP_URL || 'http://localhost:4181';
const VISIT_ID = '0b8bcc44-3a8d-4e03-b84d-bd0cd186dcc7';

const browser = await chromium.launch({ headless: true });
let failures = 0;
const check = (ok, label, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`); if (!ok) failures += 1; };

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));

const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' };
await page.route('**/auth/get-session', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ user: { id: 'proof-operator', email: 'operator@omni', name: 'Opérateur' }, session: { user: { id: 'proof-operator' } } }),
}));
await page.route('**/auth/token', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }),
}));
await page.route('**/api/v2/account/context', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ ok: true, data: {
    accountId: 'acct-op', roles: ['operator'], onboardingState: 'complete', suspended: false,
    facilityCount: 0, ownedFacilityIds: [],
    capabilities: { sellerWorkspace: false, operatorTools: true, reviewerWorkspace: true, adminTools: true },
  } }),
}));
// The field tour — one dossier (verification on a real-shaped facility).
await page.route('**/api/v2/public/facilities?reviewer=field-visits', (route) => route.fulfill({
  status: 200, contentType: 'application/json', headers: cors,
  body: JSON.stringify({ ok: true, data: { authorized: true, visits: [{
    id: VISIT_ID, subjectType: 'verification', subjectId: '20000000-0000-0000-0000-000000000201',
    subjectName: "Boulangerie du Marché d'Adawlato", zone: 'Adawlato', state: 'a_visiter', mine: false,
    latitude: 6.13, longitude: 1.22, createdAt: '2026-10-06T10:00:00Z',
  }] } }),
}));

// The op-side read — the call this proof must observe.
let opSideUrl = null;
await page.route('**/api/v2/public/facilities?reviewer=op-side*', (route) => {
  opSideUrl = route.request().url();
  route.fulfill({ status: 200, contentType: 'application/json', headers: cors,
    body: JSON.stringify({ ok: true, data: { authorized: true, side: {
      subjectType: 'verification', facilityId: '20000000-0000-0000-0000-000000000201',
      entityId: 'c3665b40-0f41-4339-9499-04fe7a2a6451', entityName: "Boulangerie du Marché d'Adawlato",
      entityKind: 'organisation', trustState: 'confirmed', qualifyingSales: 3,
      publishedOfferCount: 3, pendingRequestCount: 1,
    } } }) });
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.navpill button', { timeout: 15000 });
await page.waitForTimeout(1500);

// Switch to the operator role via the real role pill (lands on the menu sheet).
await page.evaluate(() => { const b = [...document.querySelectorAll('.rolepill button')].find((x) => /Opérateur/.test(x.textContent || '')); b?.click(); });
await page.waitForTimeout(1000);

// Close the menu (dock center = « Carte ») so the operator resting dock appears.
await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Carte/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
await page.waitForTimeout(900);

// The operator dock center is « Tournée » — open it.
const dockHasTour = await page.evaluate(() => [...document.querySelectorAll('.navpill button')].some((x) => /Tournée/.test(x.querySelector('.sr-only')?.textContent || '')));
check(dockHasTour, 'the operator dock offers « Tournée »');
await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Tournée/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
await page.waitForTimeout(1200);

// Open the dossier detail, then the entity-side preview.
const dossierPresent = await page.evaluate(() => document.querySelector('[data-sheet="tour"]') !== null);
check(dossierPresent, 'the field tour sheet opens (data-sheet=tour)');
await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="tour"] button')].find((x) => /^(Prendre|Constater)$/.test((x.textContent || '').trim())); b?.click(); });
await page.waitForTimeout(800);
const hasSideButton = await page.evaluate(() => [...document.querySelectorAll('[data-sheet="tour"] button')].some((x) => /Voir ce que voit l'entité/.test(x.textContent || '')));
check(hasSideButton, "the dossier offers « Voir ce que voit l'entité »");
await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="tour"] button')].find((x) => /Voir ce que voit l'entité/.test(x.textContent || '')); b?.click(); });
await page.waitForTimeout(1200);

const sheetOpen = await page.evaluate(() => document.querySelector('[data-sheet="op-side"]') !== null);
check(sheetOpen, 'the entity-side sheet opens (data-sheet=op-side)');
check(opSideUrl !== null, 'opening the preview issues GET reviewer=op-side', opSideUrl ? 'ok' : 'no request');
check(opSideUrl !== null && opSideUrl.includes(`visit=${VISIT_ID}`), 'the read carries the dossier id');

const text = await page.evaluate(() => (document.querySelector('[data-sheet="op-side"]')?.textContent || '').replace(/\s+/g, ' '));
check(/Boulangerie du Marché d'Adawlato/.test(text), 'names the entity', text.slice(0, 80));
check(/Vérifiée/.test(text), 'shows the honest trust label (confirmed → Vérifiée)');
check(/Offres publiées/.test(text) && /3/.test(text), 'shows published offer count');
check(/1 en attente/.test(text), 'shows the entity pending-request count');
check(/sans jamais modifier à sa place/.test(text), 'states the read-only contract');

check(errs.length === 0, 'no page error during the flow', errs.join(' | '));

await browser.close();
console.log(`\n${failures === 0 ? 'OP-SIDE PROOF: PASS' : `OP-SIDE PROOF: FAIL (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
