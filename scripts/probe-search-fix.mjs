import { chromium } from 'playwright';

// SEARCH-03/04 proof (2026-10-07). Two founder-visible defects in one slice:
//   1. ENTITY search for an identity-named place ("mrs") answered a bare
//      "Aucune entité ne correspond à ce nom" with no way forward.
//   2. OFFER search for "pain" surfaced places with no "pain" (Copain, American
//      Paints) because the matcher was the literal substring `ilike '%q%'`.
// This probe drives the BUILT app the way the founder did, via the real search dock.
// Exit 1 on any regression.
//
// Usage: URL=http://localhost:4199 node scripts/probe-search-fix.mjs

const URL = process.env.URL || 'http://localhost:4199';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(5000);

const openSearch = async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.querySelector('.sr-only')?.textContent || ''));
    b?.click();
  });
  // The search input only exists while the search sheet is open.
  await page.waitForFunction(() => !!document.querySelector('input[aria-label="Recherche"]'), null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
};

const setLevel = async (label) => {
  await page.evaluate((l) => {
    const chip = [...document.querySelectorAll('.chip')].find((c) => new RegExp(l).test(c.textContent || ''));
    chip?.click();
  }, label);
  await page.waitForTimeout(400);
};

// A search closes the search sheet and opens results, so each search reopens the dock
// first, then picks the level, then types into a cleared input.
const search = async (text, levelLabel) => {
  await openSearch();
  await setLevel(levelLabel);
  await page.evaluate(() => {
    const i = document.querySelector('input[aria-label="Recherche"]');
    if (i) { i.focus(); i.setSelectionRange(0, i.value.length); }
  });
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(text, { delay: 25 });
  await page.keyboard.press('Enter');
  // Results render after the map reveal animation; wait until result cards exist.
  await page.waitForFunction(
    () => document.querySelectorAll('.hcard b').length > 0 || /aucune|lieu connu|ne correspond/i.test(document.body.innerText),
    null, { timeout: 12000 },
  ).catch(() => {});
  await page.waitForTimeout(500);
};

const bodyText = () => page.evaluate(() => document.body.innerText);
const resultNames = () =>
  page.evaluate(() => Array.from(document.querySelectorAll('.hcard b')).map((b) => b.textContent || ''));

let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const pass = (m) => console.log(`PASS ${m}`);

// --- Complaint 2: offer search for 'pain' must not surface non-pain places ---
await search('pain', 'Chercher une offre');
const names = await resultNames();
const falsePositives = names.filter((n) => /Copain|Paints|Peinture|Albert Decor|Believe Decor/i.test(n));
const truePositive = names.some((n) => /pain/i.test(n));
if (falsePositives.length > 0) fail(`offer search 'pain' surfaced non-pain places: ${falsePositives.join(', ')}`);
else if (!truePositive) fail(`offer search 'pain' lost the real bakery matches (${names.length} rows)`);
else pass(`offer search 'pain' -> ${names.length} rows, 0 false positives`);

// --- Accent-insensitivity: 'marche' must reach "Marché" ---
await search('marche', 'Chercher une offre');
const marcheNames = await resultNames();
if (marcheNames.some((n) => /March/i.test(n))) pass(`offer search 'marche' reached an accented "Marché" name`);
else fail(`offer search 'marche' did not reach "Marché" (${marcheNames.length} rows)`);

// --- A real entity still resolves by identity (run BEFORE the fallback, which leaves
// the entity list empty by design) ---
await search('boulangerie', 'Chercher une entité');
const entityNames = await resultNames();
if (entityNames.some((n) => /Boulangerie/i.test(n))) pass(`entity search 'boulangerie' still resolves the real entity`);
else fail(`entity search 'boulangerie' lost the real entity (${entityNames.length} rows)`);

// --- Complaint 1: entity search for a place name must not be a dead end ---
await search('mrs', 'Chercher une entité');
const entityText = await bodyText();
const hasPlaceHint = /lieu/i.test(entityText) && /offre/i.test(entityText);
const bareDeadEnd = /aucune entité ne correspond à ce nom\./i.test(entityText) && !/lieu/i.test(entityText);
if (hasPlaceHint) pass(`entity search 'mrs' surfaces a place hint and routes to the offer level`);
else if (bareDeadEnd) fail(`entity search 'mrs' is still a bare dead end (no place hint)`);
else fail(`entity search 'mrs' answered neither a place hint nor a clear dead-end: ${entityText.slice(0, 160)}`);

if (errors.length > 0) fail(`page errors: ${errors.join(' | ')}`);
else pass('no page errors');

console.log(failures === 0 ? 'SEARCH FIX PROBE: PASS' : `SEARCH FIX PROBE: FAIL (${failures})`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
