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
//  3. RT-D2 option (b) SUPERSEDE COR-0a : ne plus cliquer le bouton itinéraire
//     (verrouillé jusqu'à l'intention) — assertir le verrou + l'absence de tracé.
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

  // 2. Barre de recherche présente et ouvrable. Scopée au navpill en match exact :
  // le corpus contient désormais des lieux nommés « …Recherche » (ministère), qu'un
  // match flou prendrait pour le dock. Prouver le dock, pas un pin homonyme.
  const searchBtn = page.locator('.navpill').getByRole('button', { name: 'Recherche', exact: true });
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
  // D-CON-5 : 3 groupes nommés, pas un bloc « CONTRAINTES » (renommé, tester le neuf).
  // Mesurer le texte RENDU, casse comprise : le CSS desktop passe les labels en capitales
  // (classe S-28), donc match insensible à la casse — pas le source.
  await input.fill(QUERY);
  await page.waitForTimeout(1500);
  const constraintText = await page.locator('body').innerText();

  const groupsFound = [/disponibilité/i, /votre besoin/i, /attributs/i].filter((re) => re.test(constraintText));
  record(
    width,
    'constraints-chips',
    groupsFound.length === 3 ? 'PASS' : 'FAIL',
    `groupes = ${groupsFound.length}/3`,
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

  // 7. RT-D2 option (b) — SUPERSEDE COR-0a : l'itinéraire est VERROUILLÉ jusqu'à
  // l'intention. Bouton visible mais désactivé, avec le vrai chemin dans le title.
  // Cliquer testerait l'ancien contrat (COR-0a, remplacé) : on assert le verrou.
  const routeBtn = page.getByRole('button', { name: /Itinéraire vers ce vendeur/i });
  const routeCount = await routeBtn.count();
  const routeDisabled = routeCount > 0 ? await routeBtn.first().isDisabled() : false;
  const routeAria = routeCount > 0 ? await routeBtn.first().getAttribute('aria-disabled') : null;
  const routeTitle = routeCount > 0 ? (await routeBtn.first().getAttribute('title')) ?? '' : '';
  const routeLocked = routeCount > 0 && routeDisabled && routeAria === 'true' && /intention/i.test(routeTitle);
  record(
    width,
    'route-locked-before-intent',
    routeLocked ? 'PASS' : 'FAIL',
    routeLocked ? 'bouton visible désactivé, chemin intention nommé' : 'VERROU RT-D2 ABSENT',
  );
  record(
    width,
    'route-promise-honest',
    /comme le contact vendeur, l.+itinéraire se débloque après/i.test(fiche) ? 'PASS' : 'FAIL',
    'promesse verrou-intention honnête (RT-D2)',
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

  // 9. Pré-intention : aucun tracé ne peut partir (le bouton est désactivé, le
  // callback ne pose jamais de routeTarget). Contrat honnête : chip absente ou
  // dégradé étiqueté — jamais un faux tracé.
  {
    const chip = page.locator('.route-status-chip');
    const chipCount = await chip.count();
    const chipText = chipCount ? (await chip.first().innerText()).trim().replace(/\s+/g, ' ') : '';
    const chipState = chipCount ? await chip.first().getAttribute('data-state') : null;
    const noLiveTrace = chipCount === 0 || chipState === 'unavailable';
    record(
      width,
      'no-route-before-intent',
      noLiveTrace ? 'PASS' : 'FAIL',
      chipCount ? `data-state=${chipState} — « ${chipText.slice(0, 80)} »` : 'aucun tracé avant intention',
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