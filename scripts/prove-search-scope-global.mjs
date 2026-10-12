// PROOF — SEARCH-SCOPE: a typed offer search is GLOBAL (founder 2026-10-07).
//
// The founder searched « pain » among OFFERS → nothing; the ENTITY level of the same
// search said 6 places. Cause: the offer search passed the map viewport, so an offer that
// exists on the map was unfindable when the map was elsewhere, while the entity level
// searched the whole corpus.
//
// This drives the real built app with the geolocation moved far from Lomé (the map settles
// elsewhere), then searches « pain » among offers — it must still find the Lomé bakery.
// Run against prod: it FAILS on the pre-fix bundle and PASSES after deploy.
import { chromium } from 'playwright';

const target = process.env.TARGET || 'https://omni.sparkafrika.online';
const results = [];
const ok = (n, p, d = '') => results.push({ n, p, d });

const b = await chromium.launch({ headless: true });
// The map centres on the user. Move the user far from Lomé so the viewport is elsewhere.
const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, geolocation: { latitude: 48.8566, longitude: 2.3522 }, permissions: ['geolocation'] });
const p = await ctx.newPage();
const pageErrors = [];
p.on('pageerror', (e) => pageErrors.push(String(e)));
await p.route('**/auth/get-session', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': target, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ user: { id: 'proof-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' }, session: { user: { id: 'proof-buyer' } } }) }));
await p.route('**/auth/token', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': target, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }) }));

let lastBounds = null;
p.on('request', (r) => { const m = r.url().match(/public\/facilities\?west=([-\d.]+).*north=([-\d.]+)/); if (m) lastBounds = { west: +m[1], north: +m[2] }; });

await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(6000);

const openSearch = () => p.evaluate(() => { [...document.querySelectorAll('.navpill button, #rail button')].find((x) => /Recherche/.test(x.textContent || ''))?.click(); });
const waitResults = async () => { for (let i = 0; i < 14; i++) { if (await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet') === 'results')) return true; await p.waitForTimeout(700); } return false; };
const resultsText = () => p.evaluate(() => (document.querySelector('.sheet[data-sheet="results"]')?.innerText ?? '').replace(/\s+/g, ' ').trim());

// Confirm the map is NOT on Lomé (the viewport was moved by the geolocation override).
const farFromLome = lastBounds && (Math.abs(lastBounds.west - 1.2) > 3 || Math.abs(lastBounds.north - 6.13) > 3);
ok('la carte s’est installée loin de Lomé (viewport ailleurs)', !!farFromLome, `bounds=${JSON.stringify(lastBounds)}`);

await openSearch(); await p.waitForTimeout(900);
await p.evaluate(() => [...document.querySelectorAll('.chip')].find((c) => (c.textContent || '').includes('Chercher une offre'))?.click());
await p.waitForTimeout(200);
await (await p.$('input[aria-label="Recherche"]')).fill('pain');
await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('form')?.requestSubmit?.());
const opened = await waitResults();
const text = await resultsText();
const hasBakery = /Boulangerie du Marché d['’]Adawlato|Pain d['’]or/i.test(text);
ok('la recherche d’offre « pain » ouvre la feuille de résultats', opened, `sheet=${await p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet'))}`);
ok('« pain » remonte les lieux qui portent une offre pain, carte ailleurs (jamais 0)', hasBakery, text.slice(0, 200));
ok('le compteur de résultats n’est pas 0', !/Facilités proches\s*0\b/.test(text), text.slice(0, 90));
ok('0 pageerror pendant le parcours', pageErrors.length === 0, pageErrors.join(' | '));

await b.close();
const pass = results.every((r) => r.p);
for (const r of results) console.log(`${r.p ? 'PASS' : 'FAIL'}  ${r.n}${r.p ? '' : `  :: ${r.d}`}`);
console.log(`\n${results.filter((r) => r.p).length}/${results.length} PASS  (target ${target})`);
process.exit(pass ? 0 : 1);
