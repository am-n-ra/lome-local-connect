// AUTH-RESUME probe: a gated action (Comparer) must be RESUMED after sign-in,
// not dropped on the menu. Run against prod to confirm the fix end to end.
//
//   URL=https://omni.sparkafrika.online node scripts/probe-auth-resume.mjs
//
// Baseline BEFORE the fix: after login the stage sheet is `menu` (FAIL),
// the buyer must redo the search. AFTER: the stage sheet is `compare` (PASS).
import { chromium } from 'playwright';

const URL = process.env.URL || 'https://omni.sparkafrika.online';
const EMAIL = process.env.PROBE_EMAIL || 'demo@buyer.omni';
const PASSWORD = process.env.PROBE_PASSWORD || 'Omni@2026';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const pass = (m) => console.log(`PASS ${m}`);

const sheet = () => page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));

async function searchStation() {
  await page.evaluate(() => { [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.querySelector('.sr-only')?.textContent || ''))?.click(); });
  await page.waitForFunction(() => !!document.querySelector('input[aria-label="Recherche"]'), null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => { const i = document.querySelector('input[aria-label="Recherche"]'); i.focus(); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.keyboard.type('station', { delay: 20 }); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('#hgrid .hcard').length > 2, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(5000);

// 1) A gated action with NO session must open the access portal.
await searchStation();
await page.evaluate(() => { [...document.querySelectorAll('button')].find((x) => /^Comparer$/.test((x.textContent || '').trim()))?.click(); });
await page.waitForTimeout(2500);
if (await page.$('#v13-email')) pass("Comparer sans session ouvre l'ecran de connexion");
else fail("Comparer sans session n'a pas ouvert l'ecran de connexion");

// 2) Sign in, then the action must RESUME (not land on the menu).
await page.fill('#v13-email', EMAIL);
await page.fill('#v13-password', PASSWORD);
await page.evaluate(() => document.querySelector('#v13-email')?.closest('form')?.requestSubmit?.());
await page.waitForFunction(() => ['compare', 'menu', 'onboard'].includes(document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet') || ''), null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(5000);
const after = await sheet();
if (after === 'compare') pass("apres connexion, l'action est REPRISE (feuille compare)");
else if (after === 'menu') fail("apres connexion, l'action est PERDUE (atterrit sur le menu)");
else fail(`apres connexion, feuille inattendue: ${after}`);

// 3) The resume is a real comparison, not an empty shell.
const cmp = await page.evaluate(() => {
  const s = document.querySelector('[data-sheet="compare"]');
  return { rows: s ? s.querySelectorAll('.cardbox b').length : 0, chips: s ? s.querySelectorAll('.sortchip').length : 0 };
});
if (cmp.rows > 0 && cmp.chips === 4) pass(`la comparaison est vivante (${cmp.rows} lignes, ${cmp.chips} tris)`);
else fail(`la comparaison reprise est vide (rows=${cmp.rows}, chips=${cmp.chips})`);

// 4) The SAME class, a different destination: "Recherches sauvegardées" from the
//    search sheet must also resume (that link is reachable logged-out).
const browser2 = await chromium.launch();
const p2 = await browser2.newPage({ viewport: { width: 1280, height: 900 } });
await p2.goto(URL, { waitUntil: 'load' }); await p2.waitForTimeout(5000);
await p2.evaluate(() => { [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.querySelector('.sr-only')?.textContent || ''))?.click(); });
await p2.waitForTimeout(1500);
const openedSearch = await p2.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
if (openedSearch !== 'search') fail(`la recherche ne s'ouvre pas (${openedSearch})`);
await p2.evaluate(() => { [...document.querySelectorAll('[data-sheet="search"] button, [data-sheet="search"] .linkbtn')].find((x) => /Recherches sauvegard/i.test(x.textContent || ''))?.click(); });
await p2.waitForTimeout(2500);
if (await p2.$('#v13-email')) pass('Recherches sauvegardees sans session ouvre l\'ecran de connexion');
else fail('Recherches sauvegardees n\'a pas ouvert la connexion');
await p2.fill('#v13-email', EMAIL); await p2.fill('#v13-password', PASSWORD);
await p2.evaluate(() => document.querySelector('#v13-email')?.closest('form')?.requestSubmit?.());
await p2.waitForFunction(() => ['saved', 'menu', 'onboard'].includes(document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet') || ''), null, { timeout: 15000 }).catch(() => {});
await p2.waitForTimeout(5000);
const w = await p2.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
if (w === 'saved') pass('apres connexion, les Recherches sauvegardees sont REPRISES');
else fail(`apres connexion, la destination n'est pas reprise (${w})`);
await browser2.close();

if (errors.length > 0) fail(`page errors: ${errors.join(' | ')}`);
else pass('no page errors');

console.log(`\nAUTH-RESUME PROBE: ${failures === 0 ? 'PASS' : `FAIL (${failures})`}`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
