// PROOF — BRANCHES-PRICE-DISPLAY (founder 2026-10-13).
//
// Founder: "ok pour l'affichage des prix on montre le prix sans et avec remise ?"
// The accepted maquette shows BOTH prices (the Omni price + the struck-through original)
// plus the `−N % Omni` badge. The app only ever showed the discounted price.
//
// This drives the REAL built app with a mocked session (the same seam the sibling
// SEARCH-SCOPE proof uses), then searches « pain » among offers and asserts:
//  1. A discounted facility's result card shows the Omni price, the struck original
//     AND the `−N % Omni` badge.
//  2. The offer sheet product row shows the same pair + badge.
//  3. The struck original is never equal to the shown price (no fake saving anywhere).
//  4. No page error.
//
// Run against prod: it FAILS on the pre-fix bundle and PASSES after deploy.
import { chromium } from 'playwright';

const target = process.env.TARGET || 'https://omni.sparkafrika.online';
const results = [];
const ok = (n, p, d = '') => { results.push({ n, p, d }); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${p ? '' : `  :: ${d}`}`); };

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const pageErrors = [];
p.on('pageerror', (e) => pageErrors.push(String(e)));
await p.route('**/auth/get-session', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': target, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ user: { id: 'proof-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' }, session: { user: { id: 'proof-buyer' } } }) }));
await p.route('**/auth/token', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': target, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }) }));

await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(6000);

// Search « pain » among OFFERS → a discounted facility (Boulangerie du Marché d'Adawlato).
await p.evaluate(() => { [...document.querySelectorAll('.navpill button, #rail button')].find((x) => /Recherche/.test(x.textContent || ''))?.click(); });
await p.waitForTimeout(900);
await p.evaluate(() => [...document.querySelectorAll('.chip')].find((c) => (c.textContent || '').includes('Chercher une offre'))?.click());
await p.waitForTimeout(200);
await (await p.$('input[aria-label="Recherche"]')).fill('pain');
await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('form')?.requestSubmit?.());
for (let i = 0; i < 14; i++) { if (await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet') === 'results')) break; await p.waitForTimeout(700); }
ok('la recherche « pain » ouvre la feuille de résultats', await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet') === 'results'), `sheet=${await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet'))}`);
const hcardCount = await p.evaluate(() => document.querySelectorAll('.hcard').length);
ok('des cartes résultat sont rendues', hcardCount > 0, `hcards=${hcardCount}`);

// --- 1. Result card: both prices + badge ---
const card = await p.evaluate(() => {
  const c = [...document.querySelectorAll('.hcard')].find((x) => x.querySelector('.old') || x.querySelector('.promo'));
  if (!c) return null;
  const pr = c.querySelector('.pr');
  return {
    price: pr?.firstChild?.textContent?.trim() ?? '',
    old: c.querySelector('.old')?.textContent?.trim() ?? null,
    promo: c.querySelector('.promo')?.textContent?.trim() ?? null,
    body: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 120),
  };
});
ok('carte résultat : prix Omni + origine barrée + badge', !!card && !!card.old && !!card.promo, JSON.stringify(card));
if (card) ok("carte résultat : l'origine diffère du prix affiché", card.old !== card.price, `price="${card.price}" old="${card.old}"`);

// --- 2. Offer sheet product row ---
await p.evaluate(() => { [...document.querySelectorAll('.hcard')].find((x) => x.querySelector('.old'))?.click(); });
await p.waitForTimeout(3000);
ok('la fiche offre s\'ouvre', await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet') === 'facility'), `sheet=${await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet'))}`);
const row = await p.evaluate(() => {
  const r = [...document.querySelectorAll('.pitem')].find((x) => x.querySelector('.old') || x.querySelector('.promo'));
  if (!r) return null;
  return {
    price: r.querySelector('.pr')?.firstChild?.textContent?.trim() ?? '',
    old: r.querySelector('.old')?.textContent?.trim() ?? null,
    promo: r.querySelector('.promo')?.textContent?.trim() ?? null,
  };
});
ok('fiche offre : ligne produit montre prix + origine + badge', !!row && !!row.old && !!row.promo, JSON.stringify(row));

// --- 3. Honesty: no struck price equals the shown price anywhere on screen ---
const noFakeSaving = await p.evaluate(() => {
  const pairs = [...document.querySelectorAll('.pr')].filter((x) => x.querySelector('.old'));
  return pairs.every((x) => {
    const shown = x.firstChild?.textContent?.trim() ?? '';
    const old = x.querySelector('.old')?.textContent?.trim() ?? '';
    return shown && old && shown !== old;
  });
});
ok('aucun faux rabais (origine ≠ prix affiché)', noFakeSaving, `checked=${noFakeSaving}`);

ok('aucune erreur de page', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));

await b.close();
const failed = results.filter((r) => !r.p);
console.log(`\n${results.length - failed.length}/${results.length} PASS  (target ${target})`);
process.exit(failed.length === 0 ? 0 : 1);
