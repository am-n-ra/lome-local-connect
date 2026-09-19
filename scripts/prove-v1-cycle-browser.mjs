#!/usr/bin/env node
// PRE-1 — preuve navigateur du cycle V1 sur la production (4 largeurs).
// Exerce le code réellement déployé (omni.sparkafrika.online) avec un vrai
// navigateur. Ce qui exige une session fondateur (intention, QR, paiement) n'est
// pas simulé : le script l'atteste explicitement (BLOCKED) au lieu de l'inventer.
//
// Deux pièges rencontrés en écrivant cette preuve, corrigés ici :
//  1. Les chips de contraintes sont en divulgation progressive (`constraintsOpen`
//     s'ouvre à la frappe) — les assertir sur la sheet vierge produit un faux négatif.
//  2. Le libellé du bouton d'itinéraire est « Itinéraire vers ce vendeur », et les
//     résultats sont des `button` portant le nom de la facilité (pas de `.hcard`).
//     Chercher une chaîne inexistante échoue sans que le produit soit en cause.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.PRE1_BASE_URL ?? 'https://omni.sparkafrika.online/';
const OUT = resolve(process.env.PRE1_OUT_DIR ?? 'docs/nature-way/pre1-proof');
const WIDTHS = [360, 768, 1280, 1920];
// Requête à résultat réel garanti sur la fourniture Lomé actuelle (1 facilité confirmée, 3 produits).
const QUERY = 'boulangerie';

mkdirSync(OUT, { recursive: true });

const results = [];
let failures = 0;
const record = (width, step, status, detail) => {
  results.push({ width, step, status, detail });
  if (status === 'FAIL') failures += 1;
  console.log(`  [${status}] ${step} — ${detail}`);
};

const RADIUS_LABELS = ['1 km', '5 km', '10 km', '25 km', '100 km', 'Monde'];

async function proveWidth(browser, width) {
  const height = width < 500 ? 780 : 900;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    permissions: [], // géoloc refusée : on prouve le chemin dégradé honnête
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  console.log(`\n=== ${width}x${height} ===`);
  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);

  // 1. Arrivée : le shell rend, la carte est active.
  const title = await page.title();
  record(width, 'arrival', title.includes('Omni') ? 'PASS' : 'FAIL', `title="${title}"`);

  const mapOk = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { ok: false, reason: 'no canvas' };
    return { ok: true, w: canvas.width, h: canvas.height };
  });
  record(
    width,
    'map-renders',
    mapOk.ok && mapOk.w > 0 ? 'PASS' : 'FAIL',
    mapOk.ok ? `canvas ${mapOk.w}x${mapOk.h}` : mapOk.reason,
  );

  const mapError = await page.locator('text=Carte indisponible').count();
  record(width, 'map-not-error', mapError === 0 ? 'PASS' : 'FAIL', `banner count=${mapError}`);

  // Fourniture réelle : des pins ouvrables, pas seulement un canvas monté.
  const pinCount = await page.getByRole('button', { name: /^Ouvrir / }).count();
  record(
    width,
    'supply-present',
    pinCount > 0 ? 'PASS' : 'FAIL',
    `${pinCount} pins ouvrables`,
  );

  // 2. Barre de recherche présente et ouvrable.
  const searchBtn = page.getByRole('button', { name: 'Recherche' });
  record(width, 'search-affordance', (await searchBtn.count()) > 0 ? 'PASS' : 'FAIL', 'bouton Recherche');
  await searchBtn.first().click();
  await page.waitForTimeout(1500);

  const input = page.locator('input[placeholder="Produit, service, propriété…"]').first();
  const inputReady = (await input.count()) > 0;
  record(width, 'search-sheet-open', inputReady ? 'PASS' : 'FAIL', 'champ de recherche visible');
  if (!inputReady) {
    record(width, 'search-results', 'BLOCKED', 'champ de recherche introuvable');
    await context.close();
    return;
  }

  // 3. Contraintes : la zone s'ouvre à la frappe (divulgation progressive).
  await input.fill(QUERY);
  await page.waitForTimeout(1500);
  const constraintText = await page.locator('body').innerText();

  record(
    width,
    'constraints-chips',
    /CONTRAINTES/i.test(constraintText) ? 'PASS' : 'FAIL',
    'bloc Contraintes ouvert après saisie',
  );

  const radiusFound = RADIUS_LABELS.filter((r) => constraintText.includes(r));
  record(
    width,
    'radius-chips',
    radiusFound.length === 6 ? 'PASS' : 'FAIL',
    `portée = ${radiusFound.length}/6`,
  );

  // Honnêteté : les surfaces non livrées sont marquées « bientôt », jamais décoratives.
  record(
    width,
    'honest-soon-labels',
    /bient[oô]t/i.test(constraintText) ? 'PASS' : 'FAIL',
    'chips « bientôt » présentes',
  );
  const soonDisabled = await page.locator('.chip.soon').first().getAttribute('aria-disabled');
  record(
    width,
    'soon-chips-disabled',
    soonDisabled === 'true' ? 'PASS' : 'FAIL',
    `.chip.soon aria-disabled=${soonDisabled}`,
  );

  // 4. Recherche réelle.
  await input.press('Enter');
  await page.waitForTimeout(9000);

  const stageSheet = await page.evaluate(() =>
    document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'),
  );
  record(width, 'search-results', stageSheet === 'results' ? 'PASS' : 'FAIL', `sheet=${stageSheet}`);

  // Cibler la liste de résultats : un pin de carte porte le même nom et
  // intercepte le clic (le canvas MapLibre est au-dessus).
  const resultsScope = page.locator('section[data-sheet="results"]');
  const resultBtn = resultsScope.locator('.hcard').first();
  const resultCount = await resultBtn.count();
  const resultName = resultCount
    ? (await resultBtn.innerText()).trim().replace(/\s+/g, ' ').slice(0, 60)
    : '';
  record(
    width,
    'result-item-present',
    resultCount > 0 ? 'PASS' : 'FAIL',
    resultCount ? `carte résultat « ${resultName} »` : `aucune carte dans la liste pour "${QUERY}"`,
  );

  if (resultCount === 0) {
    record(width, 'facility-fiche', 'BLOCKED', 'aucun résultat à ouvrir');
    record(width, 'no-console-errors', consoleErrors.length === 0 ? 'PASS' : 'FAIL', consoleErrors.slice(0, 2).join(' | ') || 'console propre');
    await context.close();
    return;
  }

  // 5. Ouvrir la fiche facilité.
  await resultBtn.click();
  await page.waitForTimeout(4000);
  const fiche = await page.locator('body').innerText();
  const ficheOpen = /Revendiquer|Itinéraire|Localisation|Adresse/i.test(fiche);
  record(width, 'facility-fiche', ficheOpen ? 'PASS' : 'FAIL', 'fiche facilité ouverte');

  // 6. État de confiance nommé honnêtement (triptyque toujours rendu).
  const trustHonest = /Non revendiquée|À confirmer|Confirmée/.test(fiche);
  record(width, 'trust-state-honest', trustHonest ? 'PASS' : 'FAIL', 'libellé de confiance');

  // 7. COR-0a : itinéraire disponible AVANT intention d'achat.
  const routeBtn = page.getByRole('button', { name: /Itinéraire vers ce vendeur/i });
  const routeBefore = (await routeBtn.count()) > 0;
  record(
    width,
    'route-available-before-intent',
    routeBefore ? 'PASS' : 'FAIL',
    'bouton itinéraire sur la fiche, avant intention',
  );
  record(
    width,
    'route-promise-honest',
    /Contact & chat restent débloqués après intention/i.test(fiche) ? 'PASS' : 'FAIL',
    'promesse contact/chat honnête',
  );

  // 8. RAC-1 : le contact n'est PAS exposé avant intention.
  const contactLeak = /(\+228\s?\d|tel:\+?\d|whatsapp:\s*\+?\d)/i.test(fiche);
  record(
    width,
    'contact-gated-before-intent',
    !contactLeak ? 'PASS' : 'FAIL',
    contactLeak ? 'FUITE de contact détectée' : 'aucun numéro exposé avant intention',
  );

  await page.screenshot({ path: `${OUT}/w${width}-facility-fiche.png`, fullPage: false });

  // 9. Déclencher l'itinéraire — la géoloc est refusée par construction dans
  // cette preuve, donc le contrat honnête est : soit le tracé, soit le message
  // « Position indisponible… ». Assertir le tracé seul serait un faux négatif.
  if (routeBefore) {
    await routeBtn.first().click();
    await page.waitForTimeout(3500);
    const chip = page.locator('.route-status-chip');
    const chipCount = await chip.count();
    const chipText = chipCount ? (await chip.first().innerText()).trim().replace(/\s+/g, ' ') : '';
    const chipState = chipCount ? await chip.first().getAttribute('data-state') : null;
    const honest =
      /Itinéraire vers/i.test(chipText) || /Position indisponible/i.test(chipText);
    record(
      width,
      'route-render',
      chipCount > 0 && honest ? 'PASS' : 'FAIL',
      chipCount ? `data-state=${chipState} — « ${chipText.slice(0, 80)} »` : 'aucun statut d’itinéraire',
    );
    record(
      width,
      'route-degraded-honest',
      !/Position indisponible/i.test(chipText) || chipState === 'unavailable' ? 'PASS' : 'FAIL',
      chipState === 'unavailable'
        ? 'dégradé étiqueté « unavailable », pas un faux tracé'
        : 'tracé réel affiché',
    );
    await page.screenshot({ path: `${OUT}/w${width}-route.png`, fullPage: false });
  }

  // 10. Aucune erreur console fatale (glyphes compris : régression surveillée).
  const fatal = consoleErrors.filter((e) => !/favicon|manifest|serviceWorker/i.test(e));
  record(
    width,
    'no-console-errors',
    fatal.length === 0 ? 'PASS' : 'FAIL',
    fatal.length ? fatal.slice(0, 2).join(' | ') : 'console propre',
  );

  await context.close();
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

try {
  for (const w of WIDTHS) await proveWidth(browser, w);
} finally {
  await browser.close();
}

const pass = results.filter((r) => r.status === 'PASS').length;
const blocked = results.filter((r) => r.status === 'BLOCKED').length;
const total = results.length;

const report = {
  baseUrl: BASE,
  asOf: new Date().toISOString(),
  widths: WIDTHS,
  query: QUERY,
  summary: { total, pass, fail: failures, blocked },
  results,
};
writeFileSync(`${OUT}/pre1-results.json`, JSON.stringify(report, null, 2));

console.log(`\n=== PRE-1 SUMMARY ===`);
console.log(`PASS ${pass} / ${total} (BLOCKED ${blocked}, FAIL ${failures})`);
console.log(`artefacts: ${OUT}`);
process.exit(failures > 0 ? 1 : 0);