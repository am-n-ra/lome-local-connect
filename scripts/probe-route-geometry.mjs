#!/usr/bin/env node
// Sonde de fidélité d'itinéraire — pourquoi le tracé est-il une ligne droite ?
//
// Le client distingue lui-même les deux états dans le libellé du chip :
//   routier : « Itinéraire vers X · 2,4 km · 7 min »
//   direct  : « Itinéraire vers X · 2,1 km (tracé direct — <raison>) »
// Lire ce libellé après avoir accordé la géolocalisation dit donc exactement si
// une vraie route a été dessinée. On capture en plus la réponse HTTP réelle du
// serveur, et la présence de l'en-tête Authorization, pour séparer la cause
// serveur de la cause client.
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE_URL ?? 'https://omni.sparkafrika.online/';
const QUERY = 'boulangerie';
// Centre de Lomé (zone d'Adawlato) : position plausible pour un acheteur réel.
const GEO = { latitude: 6.1315, longitude: 1.2138 };

const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'fr-FR',
  geolocation: GEO,
  permissions: ['geolocation'],
});
const page = await context.newPage();

const routingCalls = [];
page.on('response', async (response) => {
  const url = response.url();
  if (!url.includes('/api/v2/public/routing')) return;
  let body = null;
  try { body = await response.json(); } catch { /* non-JSON */ }
  routingCalls.push({
    status: response.status(),
    hassAuth: Boolean(await response.request().headerValue('authorization').catch(() => null)),
    url: url.replace(BASE, '/'),
    body,
  });
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);

await page.getByRole('button', { name: 'Recherche' }).first().click();
await page.waitForTimeout(1200);
await page.getByPlaceholder(/Produit, service/).fill(QUERY);
await page.getByPlaceholder(/Produit, service/).press('Enter');
await page.waitForTimeout(9000);

// Le canvas MapLibre est au-dessus : viser la LISTE, jamais un pin (même nom).
const resultsScope = page.locator('section[data-sheet="results"]');
const result = resultsScope.locator('.hcard').first();
if ((await result.count()) === 0) {
  console.log('AUCUN RÉSULTAT — abandon');
  await browser.close();
  process.exit(0);
}
await result.click();
await page.waitForTimeout(4000);

const routeBtn = page.getByRole('button', { name: /Itinéraire vers ce vendeur/i });
console.log('bouton itinéraire présent :', (await routeBtn.count()) > 0);
if ((await routeBtn.count()) > 0) {
  await routeBtn.first().click();
  await page.waitForTimeout(6000);
}

const chip = page.locator('.route-status-chip');
const chipCount = await chip.count();
const chipText = chipCount ? (await chip.first().innerText()).trim().replace(/\s+/g, ' ') : '';
const chipState = chipCount ? await chip.first().getAttribute('data-state') : null;

console.log('\n=== CHIP AFFICHÉ ===');
console.log('  data-state :', chipState);
console.log('  texte      :', chipText || '(vide)');
console.log('  verdict    :', /tracé direct/i.test(chipText) ? 'LIGNE DROITE (dégradé assumé)' : /Itinéraire vers/i.test(chipText) ? 'ROUTE RÉELLE' : 'indéterminé');

console.log('\n=== APPELS /api/v2/public/routing OBSERVÉS ===');
if (routingCalls.length === 0) console.log('  AUCUN appel émis par le client');
for (const call of routingCalls) {
  const data = call.body?.data;
  const err = call.body?.error;
  console.log(`  HTTP ${call.status} auth=${call.hassAuth}`);
  console.log(`    available=${data?.available} reason=${data?.reason ?? err?.code ?? '-'} points=${data?.coordinates?.length ?? '-'}`);
  // Le message brut porte la cause exacte (ex. « returned 401 », « NoSegment »).
  // Le libellé affiché, lui, est volontairement générique : ne pas confondre les deux.
  const detail = data?.message ?? err?.message;
  if (detail) console.log(`    message brut="${detail}"`);
  if (data?.provider) console.log(`    provider=${data.provider} profile=${data.profile}`);
  if (data?.distanceMeters != null) console.log(`    distance=${data.distanceMeters}m durée=${data.durationSeconds}s`);
}

await page.screenshot({ path: 'docs/nature-way/pre1-proof/probe-route-1280.png' });
await browser.close();
console.log('\ncapture: docs/nature-way/pre1-proof/probe-route-1280.png');