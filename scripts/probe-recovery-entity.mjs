// PROBE — founder bug: "Reprendre où j'en étais" should return to the right sheet
// (e.g. the search sheet) but lands on the entity page / wrong sheet.
// Scenario: search at ENTITY level → open an entity → menu → home → Reprendre →
// "Revenir à ma recherche" → where do we land?
import { chromium } from 'playwright';

const target = process.env.TARGET || 'http://localhost:12000';
const FID = '20000000-0000-0000-0000-000000000101';
const EID = 'e1111111-1111-1111-1111-111111111111';
const FACILITIES = [{ id: FID, name: 'Omni Demo Seller Hub', category: 'Food', address: 'Lome', latitude: 6.13, longitude: 1.22, trust: 'confirmed', existenceLevel: 4, sponsored: false, entityId: EID, products: [] }];
const DETAIL = { id: FID, name: 'Omni Demo Seller Hub', category: 'Food', address: 'Lome', latitude: 6.13, longitude: 1.22, trust: 'confirmed', entityId: EID, contactPhone: null, contactWhatsapp: null, products: [{ id: 'p1', name: 'Box déjeuner', stockLoueOmni: 3, prixReduit: 800, currency: 'XOF', priceKind: 'fixe' }] };
const ENTITY = { id: EID, name: 'Omni Demo Seller Hub', kind: 'organisation', trust: 'confirmed', offerCount: 1, address: 'Lome', offers: [{ id: 'p1', facilityId: FID, name: 'Box déjeuner', stockLoueOmni: 3, prixReduit: 800, currency: 'XOF' }] };

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
const headings = () => p.evaluate(() => [...document.querySelectorAll('.sheet h1, .sheet .eyebrow')].map((h) => (h.textContent || '').trim()).slice(0, 6));

const out = {};
await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(2500);
// (1) an OFFER search first, so lastSearchRef is populated
await click('Recherche'); await p.waitForTimeout(500);
await p.fill('input[aria-label="Recherche"]', 'box');
await p.evaluate(() => document.querySelector('form[data-sheet="search"]')?.requestSubmit?.());
await p.waitForTimeout(6500);
out.offerResultsSheet = await sheets();
// (2) open the facility, then its entity page
await p.evaluate(() => document.querySelector('.sheet[data-sheet="results"] .hcard')?.click());
await p.waitForTimeout(2500);
out.facilitySheet = await sheets();
await click('page de l.entit'); await p.waitForTimeout(2000);
out.entitySheet = await sheets();
// (3) menu → home → recovery
await click('Menu'); await p.waitForTimeout(600);
await click('Mes demandes'); await p.waitForTimeout(1500);
out.homeSheet = await sheets();
await click('Reprendre o'); await p.waitForTimeout(1500);
out.recoverySheets = await sheets();
out.recoveryText = await p.evaluate(() => (document.querySelector('.sheet[data-sheet="recovery"]')?.textContent || '').replace(/\s+/g, ' ').slice(0, 240));
out.resumeButtonExists = await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Revenir à ma recherche/i.test(b.textContent || '')));
// (4) "Revenir à ma recherche"
await click('Revenir à ma recherche'); await p.waitForTimeout(6500);
out.afterResume = await sheets();
out.afterResumeText = await p.evaluate(() => (document.querySelector('.sheet')?.textContent || '').replace(/\s+/g, ' ').slice(0, 200));
out.pageErrors = errors;
console.log(JSON.stringify(out, null, 2));
await b.close();
