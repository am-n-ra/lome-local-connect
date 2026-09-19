#!/usr/bin/env node
// Preuve : les glyphes de la carte doivent tous se charger, y compris « Noto Sans Bold »
// que l'hôte du style CARTO (tiles.basemaps.cartocdn.com) sert en 404 sans en-tête CORS.
// Sans reroutage, MapLibre journalise « Rendering codepoint locally instead » et les
// compteurs de clusters / libellés gras se dégradent en chiffres bruts.
//
// Usage :
//   PROOF_BASE_URL=http://127.0.0.1:4173/ PROOF_FACILITIES=.tmp-facilities.json \
//     node scripts/proof-map-glyphs.mjs
//
// Le preview statique ne sert pas l'API same-origin : PROOF_FACILITIES rejoue la charge
// réelle de production pour cette seule route, afin que les clusters existent vraiment.
// Tout le reste (style, tuiles, glyphes, couches) part comme en production.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.PROOF_BASE_URL ?? 'http://127.0.0.1:4173/';
const FIXTURE = process.env.PROOF_FACILITIES ?? null;

// Une requête de glyphes se reconnaît à sa plage Unicode finale (`0-255.pbf`), pas à un
// segment `/fonts/` : l'hôte de repli sert les mêmes fichiers à la racine de l'hôte
// (`fonts.openmaptiles.org/Noto Sans Bold/0-255.pbf`). Matcher sur `/fonts/` raterait
// précisément toutes les requêtes réécrites et ferait passer la preuve à vide.
const GLYPH_REQUEST = /\/\d+-\d+\.pbf/;
const FORBIDDEN_GLYPH_HOST = /cartocdn\.com\/fonts\/.*Noto%20Sans%20Bold/;
const BOLD_ON_SAFE_HOST = /openmaptiles\.org\/.*Noto%20Sans%20Bold/;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });

if (FIXTURE) {
  const body = readFileSync(FIXTURE, 'utf8');
  await context.route('**/api/v2/public/facilities*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
}

const page = await context.newPage();
const glyphs = [];
const errors = [];
page.on('response', (r) => {
  if (GLYPH_REQUEST.test(r.url())) glyphs.push({ status: r.status(), url: r.url() });
});
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(9000);

// Dézoomer vers la vue monde : c'est là que la couche omni-cluster-count
// (text-font « Noto Sans Bold ») matérialise les clusters et demande sa plage.
await page.mouse.move(720, 450);
for (let i = 0; i < 8; i += 1) {
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(700);
}
await page.waitForTimeout(10000);

const failed = glyphs.filter((g) => g.status >= 400);
const onForbiddenHost = glyphs.filter((g) => FORBIDDEN_GLYPH_HOST.test(g.url));
const boldServed = glyphs.filter((g) => BOLD_ON_SAFE_HOST.test(g.url));
const glyphErrors = errors.filter((e) => /glyph|CORS|codepoint|ERR_FAILED/i.test(e));

const summary = {
  baseUrl: BASE,
  asOf: new Date().toISOString(),
  glyphRequests: glyphs.length,
  failing: failed.length,
  requestsStillOnBrokenHost: onForbiddenHost.length,
  boldServedFromWorkingHost: boldServed.length,
  glyphConsoleErrors: glyphErrors.length,
};

console.log('=== PROOF: map glyphs ===');
for (const g of glyphs.slice(0, 12)) {
  console.log(`  ${g.status}  ${decodeURIComponent(g.url).slice(0, 110)}`);
}
console.log(JSON.stringify(summary, null, 2));

if (!glyphs.length) {
  console.log('\nFAIL: aucun glyphe demandé — le rendu des libellés n’a pas été exercé.');
}
if (failed.length) console.log(`FAIL: ${failed.length} requête(s) de glyphes en échec`);
if (onForbiddenHost.length) console.log('FAIL: requêtes encore dirigées vers l’hôte cassé');
if (glyphErrors.length) console.log(`FAIL: ${glyphErrors.length} erreur(s):\n${glyphErrors.join('\n')}`);

await browser.close();

const ok =
  glyphs.length > 0 && !failed.length && !onForbiddenHost.length && !glyphErrors.length;
console.log(ok ? '\nPASS: chaque glyphe servi, aucun report vers l’hôte cassé' : '\nFAIL');
process.exit(ok ? 0 : 1);