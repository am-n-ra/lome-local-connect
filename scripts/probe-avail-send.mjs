// PROBE — BUG-1: does "Envoyer la demande" (availability request) actually submit?
// Scenario: offer search → open facility → select a product → "Demander la disponibilité"
// → flow sheet → click "Envoyer la demande" → expect the pending stage.
import { chromium } from 'playwright';

const target = process.env.TARGET || 'http://localhost:12000';
const EID = 'e1111111-1111-1111-1111-111111111111';
const FID = '20000000-0000-0000-0000-000000000101';
const FACILITIES = [{ id: FID, name: 'Omni Demo Seller Hub', category: 'Food', address: 'Lome', latitude: 6.13, longitude: 1.22, trust: 'confirmed', existenceLevel: 4, sponsored: false, entityId: EID, products: [] }];
const DETAIL = { id: FID, name: 'Omni Demo Seller Hub', category: 'Food', address: 'Lome', latitude: 6.13, longitude: 1.22, trust: 'confirmed', entityId: EID, contactPhone: null, contactWhatsapp: null, products: [{ id: 'p1', name: 'Box déjeuner', stockLoueOmni: 3, prixReduit: 800, currency: 'XOF', priceKind: 'fixe' }] };

const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 780 } });
const errors = []; const reqs = [];
p.on('pageerror', (e) => errors.push(String(e && e.stack ? e.stack : e)));
p.on('request', (r) => { if (/availability|request/i.test(r.url())) reqs.push(r.method() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
const jwt = 'x.' + Buffer.from(JSON.stringify({ sub: 'demo-buyer' })).toString('base64url') + '.y';
await p.route('**/*/token', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: jwt }) }));
await p.route('**/*/get-session*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'demo-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' } }) }));
await p.route('**/api/v2/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: {} }) }));
await p.route('**/api/v2/account/context**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { roles: [], ownedFacilityIds: [], capabilities: { adminTools: false, sellerWorkspace: false }, phoneDeclared: null } }) }));
await p.route('**/api/v2/public/facilities**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: FACILITIES }) }));
await p.route('**/api/v2/facilities/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: DETAIL }) }));
await p.route('**/api/v2/availability**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { requestId: 'req-1', creditCost: 0, creditsRemaining: 3, monthlyQuota: 3, plan: 'free' } }) }));
await p.route('**/api/v2/buyer/credits**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { accountId: 'a1', plan: 'free', monthlyQuota: 3, creditsUsed: 0, extraCredits: 0, creditsRemaining: 3, periodMonth: '2026-10' } }) }));
await p.route('**/api/v2/availability-responses**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { responses: [] } }) }));

const sheets = () => p.evaluate(() => [...document.querySelectorAll('.sheet')].map((s) => s.getAttribute('data-sheet')));
const click = (re) => p.evaluate((src) => { const rx = new RegExp(src, 'i'); const el = [...document.querySelectorAll('button, .menuitem, .navpill button, #rail button')].find((x) => rx.test(x.textContent || '')); if (el) { el.click(); return true; } return false; }, re);
const stageText = () => p.evaluate(() => (document.querySelector('.sheet[data-sheet="flow"]')?.textContent || '').replace(/\s+/g, ' ').slice(0, 220));

const out = {};
try {
await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(3000);
await click('Recherche'); await p.waitForTimeout(700);
await p.fill('input[aria-label="Recherche"]', 'box');
await p.evaluate(() => document.querySelector('form[data-sheet="search"]')?.requestSubmit?.());
await p.waitForTimeout(6500);
out.results = await sheets();
await p.evaluate(() => document.querySelector('.sheet[data-sheet="results"] .hcard')?.click());
await p.waitForTimeout(2500);
out.facility = await sheets();
// select the product checkbox
await p.evaluate(() => document.querySelector('.sheet[data-sheet="facility"] .pitem')?.click());
await p.waitForTimeout(400);
out.afterSelect = await p.evaluate(() => !!document.querySelector('.sheet[data-sheet="facility"] .selbar button'));
await click('Demander la disponibilit'); await p.waitForTimeout(800);
out.flowSheet = await sheets();
out.flowStageText = await stageText();
out.sendButtonPresent = await p.evaluate(() => [...document.querySelectorAll('.sheet[data-sheet="flow"] button')].some((b) => /Envoyer la demande/.test(b.textContent || '')));
await click('Envoyer la demande'); await p.waitForTimeout(2500);
out.afterSendText = await stageText();
out.afterSendSheets = await sheets();
out.availabilityRequests = reqs;
out.pageErrors = errors;
} catch (e) { out.error = String(e); out.sheets = await sheets().catch(() => null); }
console.log(JSON.stringify(out, null, 2));
await b.close();
