// PROBE — BUG-3b: an ENTITY-level last search must resume to the ENTITY surface,
// not the offer surface. Scenario: entity search → open entity page → menu → home →
// Reprendre → "Revenir à ma recherche" → expect entity results, not offer results.
import { chromium } from 'playwright';

const target = process.env.TARGET || 'http://localhost:12000';
const EID = 'e1111111-1111-1111-1111-111111111111';
const ENTITY = { id: EID, name: 'Boulangerie du Marché', kind: 'organisation', trust: 'confirmed', offerCount: 1, address: 'Lome', offers: [{ id: 'p1', facilityId: 'f1', name: 'Pain', stockLoueOmni: 3, prixReduit: 200, currency: 'XOF' }] };

const FACILITIES = [];
const DETAIL = { id: 'f1', name: 'Boulangerie du Marché', category: 'Food', address: 'Lome', latitude: 6.13, longitude: 1.22, trust: 'confirmed', entityId: EID, contactPhone: null, contactWhatsapp: null, products: [{ id: 'p1', name: 'Pain', stockLoueOmni: 3, prixReduit: 200, currency: 'XOF', priceKind: 'fixe' }] };

const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 780 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
const jwt = 'x.' + Buffer.from(JSON.stringify({ sub: 'demo-buyer' })).toString('base64url') + '.y';
await p.route('**/*/token', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: jwt }) }));
await p.route('**/*/get-session*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'demo-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' } }) }));
await p.route('**/api/v2/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: {} }) }));
await p.route('**/api/v2/account/context**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { roles: [], ownedFacilityIds: [], capabilities: { adminTools: false, sellerWorkspace: false }, phoneDeclared: null } }) }));
await p.route('**/api/v2/public/facilities**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: FACILITIES }) }));
await p.route('**/api/v2/facilities/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: DETAIL }) }));
await p.route('**/api/v2/public/entities**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: [ENTITY] }) }));
await p.route('**/api/v2/public/entities/*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: ENTITY }) }));

const sheets = () => p.evaluate(() => [...document.querySelectorAll('.sheet')].map((s) => s.getAttribute('data-sheet')));
const click = (re) => p.evaluate((src) => { const rx = new RegExp(src, 'i'); const el = [...document.querySelectorAll('button, .menuitem, .navpill button, #rail button')].find((x) => rx.test(x.textContent || '')); if (el) { el.click(); return true; } return false; }, re);

const out = {};
try {
await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(3000);
await click('Recherche'); await p.waitForTimeout(800);
out.afterSearchOpen = await sheets();
out.searchInputPresent = await p.evaluate(() => !!document.querySelector('input[aria-label="Recherche"]'));
// switch to ENTITY level
await p.evaluate(() => { [...document.querySelectorAll('.chip')].find((c) => /Chercher une entit/i.test(c.textContent || ''))?.click(); });
await p.waitForTimeout(400);
out.afterEntityChip = await sheets();
out.searchInputAfterChip = await p.evaluate(() => !!document.querySelector('input[aria-label="Recherche"]'));
await p.fill('input[aria-label="Recherche"]', 'boulangerie');
await p.evaluate(() => document.querySelector('form[data-sheet="search"]')?.requestSubmit?.());
await p.waitForTimeout(6500);
out.entityResultsSheet = await sheets();
out.entityResultIsEntityLevel = await p.evaluate(() => /Entités trouvées/.test(document.querySelector('.sheet[data-sheet="results"]')?.textContent || ''));
await p.evaluate(() => document.querySelector('.sheet[data-sheet="results"] .hcard')?.click());
await p.waitForTimeout(2000);
out.entitySheet = await sheets();
await click('Menu'); await p.waitForTimeout(600);
await click('Mes demandes'); await p.waitForTimeout(1500);
await click('Reprendre o'); await p.waitForTimeout(1500);
out.recoveryText = await p.evaluate(() => (document.querySelector('.sheet[data-sheet="recovery"]')?.textContent || '').replace(/\s+/g, ' ').slice(0, 200));
await click('Revenir à ma recherche'); await p.waitForTimeout(6500);
out.afterResume = await sheets();
out.afterResumeIsEntityLevel = await p.evaluate(() => /Entités trouvées/.test(document.querySelector('.sheet[data-sheet="results"]')?.textContent || ''));
out.pageErrors = errors;
} catch (e) { out.error = String(e); out.partialSheets = await sheets().catch(() => null); }
console.log(JSON.stringify(out, null, 2));
await b.close();
