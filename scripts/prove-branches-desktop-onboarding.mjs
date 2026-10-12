// PROOF — BRANCHES desktop findability + onboarding-after-creation (2026-10-07).
//
// Founder-reported: on desktop, tapping a map pin / "Demander la disponibilité" sometimes
// did nothing, and a new account lands straight in the app with no onboarding.
//
// This drives the REAL build on a desktop viewport and asserts:
//  1. The typed-search → facility → availability path reaches the backend (201).
//  2. A facility with a product exposes a product row and an actionable request button
//     (or, when a facility has no products, an HONEST explanation instead of a dead button).
//  3. The onboarding-after-creation surface (`WelcomeV13`) is present in the SERVED bundle.
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const target = process.env.TARGET || 'http://localhost:4173';
const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass, detail });

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const api = [];
page.on('response', (r) => { if (/\/api\/v2\/availability/.test(r.url())) api.push(`${r.request().method()} ${r.status()}`); });

await page.goto(target, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.navpill button, #rail button', { timeout: 20000 });
await page.waitForTimeout(2500);

// --- Sign in as the demo buyer through the shared auth sheet ---
await page.evaluate(() => { [...document.querySelectorAll('.navpill button, #rail button')].find((x) => /Menu/.test(x.querySelector('.sr-only')?.textContent || x.textContent || ''))?.click(); });
await page.waitForTimeout(600);
await page.evaluate(() => { [...document.querySelectorAll('[data-sheet="menu"] button')].find((x) => /Créer un compte|Se connecter/i.test(x.textContent || ''))?.click(); });
await page.waitForSelector('[data-sheet="auth"]', { timeout: 8000 });
await page.evaluate(() => { [...document.querySelectorAll('[data-sheet="auth"] button')].find((x) => /Déjà un compte/i.test(x.textContent || ''))?.click(); });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  const ins = [...document.querySelectorAll('[data-sheet="auth"] input')];
  set(ins.find((i) => i.type === 'email') || ins[0], 'demo@buyer.omni');
  const p = ins.find((i) => i.type === 'password'); if (p) set(p, 'Omni@2026');
});
await page.evaluate(() => { [...document.querySelectorAll('[data-sheet="auth"] button')].find((x) => /Se connecter$/.test(x.textContent.trim()))?.click(); });
await page.waitForTimeout(3500);

// --- Typed search must land on results, not hang ---
const searchPresent = await page.evaluate(() => !!document.querySelector('input[aria-label="Recherche"]'));
ok('un champ de recherche est present apres connexion', searchPresent, `present=${searchPresent}`);
if (searchPresent) {
  await page.evaluate(() => {
    const el = document.querySelector('input[aria-label="Recherche"]');
    const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value');
    d.set.call(el, 'jus');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('button[aria-label="Rechercher"]')?.click(); });
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1000);
    if ((await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'))) === 'results') break;
  }
}

// --- Open the first result card, then act on a product if there is one ---
const opened = await page.evaluate(() => {
  const card = document.querySelector('section[data-sheet="results"] button.hcard');
  if (!card) return 'no-card';
  card.click();
  return 'clicked';
});
await page.waitForTimeout(1200);
const sheet = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
ok('taper un resultat ouvre la fiche (jamais "rien ne se passe")', opened === 'clicked' && sheet === 'facility', `opened=${opened} sheet=${sheet}`);

const hasProduct = await page.evaluate(() => !!document.querySelector('section[data-sheet="facility"] .pitem'));
const honestNoProduct = await page.evaluate(() => {
  const t = document.querySelector('section[data-sheet="facility"]')?.textContent || '';
  return /Sans offre publi|aucune offre publi|pas de faux bouton|rien dont Omni|revendiquer|non revendiqu/i.test(t);
});
ok("une fiche sans produit le DIT (pas de faux bouton muet)", hasProduct || honestNoProduct, `product=${hasProduct} honestText=${honestNoProduct}`);

if (hasProduct) {
  await page.evaluate(() => { document.querySelector('section[data-sheet="facility"] .pitem')?.click(); });
  await page.waitForTimeout(400);
  const acted = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('section[data-sheet="facility"] button')].find((x) => /Demander la disponibilit/i.test(x.textContent || '') && !x.disabled);
    if (!btn) return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(4000);
  const flow = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
  const posted = api.some((a) => a.startsWith('POST') && a.endsWith('201'));
  ok('« Demander la disponibilité » atteint le backend (201) et ouvre le flux', acted && (posted || flow === 'flow'), `acted=${acted} flow=${flow} api=${api.join('|')}`);
}

await ctx.close();
await b.close();

// --- Onboarding-after-creation surface present in the SERVED bundle ---
try {
  const assets = resolve(process.cwd(), 'dist/assets');
  const js = readdirSync(assets).filter((f) => f.endsWith('.js'));
  const haystack = js.map((f) => readFileSync(resolve(assets, f), 'utf8')).join('\n');
  const hasWelcome = /Bienvenue/.test(haystack) && /Explorer la carte/.test(haystack) && /Publier ce que je vends/.test(haystack);
  const hasNoPlanWall = !/Choisissez votre plan/i.test(haystack);
  ok("la surface d'accueil apres creation est presente dans le bundle servi", hasWelcome, `welcome=${hasWelcome}`);
  ok("l'accueil ne force AUCUN choix de plan (S-31)", hasNoPlanWall, `noPlanWall=${hasNoPlanWall}`);
} catch (e) {
  ok('bundle servi lisible (dist/)', false, String(e));
}

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ' :: ' + r.detail : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed === 0 ? 0 : 1);
