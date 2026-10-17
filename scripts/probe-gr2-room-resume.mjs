import { chromium } from 'playwright';

/**
 * GR-2 (suite) — la Room d'une transaction en cours doit ROUVRIR au rechargement.
 *
 * Défaut mesuré : `room` n'était pas dans `RESTORABLE_SHEETS` → recharger au milieu d'une
 * transaction retombait sur la carte nue (`data-sheet` absent), et l'utilisateur perdait le
 * fil de son achat.
 *
 * Preuve = deux signaux OBSERVABLES, pas l'absence d'erreur :
 *   1. `section[data-sheet="room"]` est rendue après chargement ;
 *   2. la transaction est RELUE côté serveur (`transaction-transitions?action=snapshot`) —
 *      c'est ce qui donne le vrai `actorRole`, jamais supposé.
 * Le preview local n'a pas d'API : on intercepte la lecture pour fournir un snapshot réel
 * (enveloppe `{ ok, data }`, la forme attendue par le client).
 */
const TARGET = process.env.TARGET || 'http://localhost:4173';
const TXN = '44444444-4444-4444-4444-444444444444';
const AUTH = { 'access-control-allow-origin': TARGET, 'access-control-allow-credentials': 'true' };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));


await page.route('**/auth/get-session', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: AUTH, body: JSON.stringify({ user: { id: 'proof-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' }, session: { user: { id: 'proof-buyer' } } }) }));
await page.route('**/auth/token', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: AUTH, body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }) }));
await page.route('**/api/v2/account/context', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: AUTH, body: JSON.stringify({ ok: true, data: { authenticated: true, onboardingState: 'buyer_ready', roles: ['buyer'] } }) }));

// La lecture de la transaction : c'est elle qui porte le rôle réel (acheteur OU vendeur).
const txnReads = [];
await page.route('**/api/v2/transaction-transitions**', (route) => {
  const u = route.request().url();
  if (/action=snapshot/.test(u) && new RegExp(TXN).test(u)) {
    txnReads.push(u);
    return route.fulfill({
      status: 200, contentType: 'application/json', headers: AUTH,
      body: JSON.stringify({ ok: true, data: {
        transactionId: TXN, state: 'intent_created', actorRole: 'buyer',
        productId: '55555555-5555-5555-5555-555555555555', facilityId: '66666666-6666-6666-6666-666666666666',
        productName: 'Pain de mie tranché 500 g', quantity: 1, unitPriceMinor: 500,
        listPriceMinor: 500, discountMinor: 0, couponCode: null, netAmountMinor: 500,
        cemented: false, sellerFacilityName: 'Boulangerie du Marché',
      } }),
    });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', headers: AUTH, body: JSON.stringify({ ok: true, data: { messages: [], events: [] } }) });
});
await page.route('**/api/v2/transactions**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: AUTH, body: JSON.stringify({ ok: true, data: { transactions: [] } }) }));
await page.route('**/api/v2/notifications/push-key', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: AUTH, body: JSON.stringify({ ok: true, data: { configured: false, publicKey: null } }) }));

// On démarre l'app AVEC une surface persistée : une Room sur une transaction en cours.
await page.addInitScript(([key, txn]) => {
  try {
    localStorage.setItem('omni-map-guide-seen', '1');
    localStorage.setItem(key, JSON.stringify({ role: 'buyer', sheet: 'room', selectedId: null, selVisitId: null, roomTransactionId: txn }));
  } catch { /* stockage indisponible */ }
  // Trace l'état de surface réellement rendu (les mutations React sont batchées : on
  // échantillonne les valeurs DISTINCTES, sinon `room` → `none` se lit « none »).
  window.__sheetTrace = [];
  let last = null;
  setInterval(() => {
    const el = document.querySelector('.omni-v13-stage');
    if (!el) return;
    const v = el.getAttribute('data-sheet');
    if (v !== last) { last = v; window.__sheetTrace.push(v); }
  }, 25);
}, ['omni-nav-state', TXN]);

await page.goto(TARGET, { waitUntil: 'load' });
await page.waitForTimeout(6000);

const trace = await page.evaluate(() => window.__sheetTrace);
const roomOpen = await page.locator('section[data-sheet="room"]').count();
const navAfter = await page.evaluate(() => { try { return localStorage.getItem('omni-nav-state'); } catch { return null; } });

let fails = 0;
const check = (c, m) => { if (!c) fails++; console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`); };

check(trace.includes('room') && roomOpen === 1, `la Room est rouverte après rechargement (trace=${trace.join('→')})`);
check(txnReads.length >= 1, `la transaction est RELUE côté serveur (${txnReads.length} lecture(s) de ${TXN.slice(0, 8)}…)`);
check(!!navAfter && navAfter.includes(TXN), `la surface persistée porte toujours la transaction`);
check(errors.length === 0, `aucune erreur console (${errors.length})`);
errors.slice(0, 3).forEach((e) => console.log('  PAGEERROR', e));

console.log(`\nGR-2 (suite) Room — ${fails === 0 ? 'CORRIGÉ' : 'NON CORRIGÉ'} : ${4 - fails} ok / ${fails} fail`);
await browser.close();
process.exit(fails === 0 ? 0 : 1);
