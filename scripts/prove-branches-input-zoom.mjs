// PROOF — BRANCHES mobile keyboard zoom (founder-reported 2026-10-07).
//
// On a touch device, a text field below 16px triggers the browser's automatic zoom on
// focus (iOS Safari, Chrome Android). This drives the real build on an emulated touch
// device and asserts every text field computes to >= 16px, while desktop stays dense.
import { chromium, devices } from 'playwright';

const target = process.env.TARGET || 'http://localhost:4173';
const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass, detail });

const b = await chromium.launch({ headless: true });

// --- Touch device: coarse pointer -> all text fields must be >= 16px ---
const touch = await b.newContext({ ...devices['iPhone 12'] });
const p = await touch.newPage();
await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.evaluate(() => { [...document.querySelectorAll('.navpill button, #rail button')].find((x) => /Menu/.test(x.textContent || ''))?.click(); });
await p.waitForTimeout(800);
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => /Cr[ée]er un compte|Se connecter/i.test(x.textContent || ''))?.click(); });
await p.waitForSelector('.sheet[data-sheet="auth"]', { timeout: 8000 });
await p.waitForTimeout(300);

const coarse = await p.evaluate(() => matchMedia('(pointer:coarse)').matches);
const sizes = await p.evaluate(() =>
  [...document.querySelectorAll('input:not([type="checkbox"]), textarea, select')].map((el) => parseFloat(getComputedStyle(el).fontSize)));
ok("l'appareil emule est bien en pointeur grossier (tactile)", coarse === true, `coarse=${coarse}`);
ok('au moins un champ de saisie est present', sizes.length > 0, `count=${sizes.length}`);
ok('TOUS les champs calculent a >= 16px sur tactile (pas de zoom)', sizes.length > 0 && sizes.every((s) => s >= 16), `min=${Math.min(...sizes)}`);
await touch.close();

// --- Desktop: fine pointer -> dense sizing preserved (no regression) ---
const desktop = await b.newContext({ viewport: { width: 1280, height: 900 } });
const d = await desktop.newPage();
await d.goto(target, { waitUntil: 'load' });
await d.waitForTimeout(2500);
const desktopCoarse = await d.evaluate(() => matchMedia('(pointer:coarse)').matches);
ok("le desktop n'est PAS en pointeur grossier (rendu dense preserve)", desktopCoarse === false, `coarse=${desktopCoarse}`);
await desktop.close();

await b.close();

const pass = results.every((r) => r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  :: ${r.detail}`}`);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} PASS  (target ${target})`);
process.exit(pass ? 0 : 1);
