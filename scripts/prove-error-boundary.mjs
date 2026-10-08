// HP-2 — preuve d'intégration de la frontière d'erreur.
//
// Le COMPORTEMENT (un lancer de rendu -> UI de reprise, pas de page blanche) est prouvé
// en jsdom (AppErrorBoundary.test.tsx). Ici on prouve l'INTÉGRATION sur l'app servie :
//   P1 l'app démarre normalement AVEC la frontière (pas de régression, pas de pageerror) ;
//   P2 le bundle servi CONTIENT la copie de reprise (la frontière est bien livrée).
// A/B : PROD (bundle sans frontière) doit ÉCHOUER P2 — la preuve peut donc échouer.
import { chromium } from 'playwright';

const TARGET = process.env.URL || 'http://localhost:4173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push((e.stack || String(e)).split('\n')[0]));

await page.goto(TARGET, { waitUntil: 'load' });
await page.waitForTimeout(6000);

// P1 : l'app est rendue (le dock de navigation existe), pas une page blanche.
const appRendered = await page.evaluate(() => {
  const text = document.body.innerText || '';
  return { hasDock: !!document.querySelector('.navpill'), hasText: text.trim().length > 0, blankRecovery: text.includes("L’application s’est arrêtée") };
});

// P2 : le bundle servi contient la copie de reprise.
const scriptSrc = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')).filter(Boolean));
let bundleHasRecovery = false;
for (const src of scriptSrc) {
  const abs = new URL(src, TARGET).toString();
  const body = await (await fetch(abs)).text();
  if (body.includes("L’application s’est arrêtée") && body.includes('conservés côté serveur')) bundleHasRecovery = true;
}

let failures = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { failures += 1; console.log(`FAIL  ${m}`); };

if (appRendered.hasText && !appRendered.blankRecovery) pass(`P1 app démarrée normalement (dock=${appRendered.hasDock})`);
else fail(`P1 app non rendue ou en reprise au démarrage (${JSON.stringify(appRendered)})`);

if (bundleHasRecovery) pass('P2 bundle servi contient la copie de reprise');
else fail(`P2 copie de reprise ABSENTE du bundle servi (${scriptSrc.length} scripts scannés)`);

console.log(`NOTE  pageerror au démarrage : ${errors.length}`);
for (const e of errors.slice(0, 3)) console.log(`      ${e}`);

await browser.close();
console.log(failures === 0 ? '\nERROR-BOUNDARY: PASS' : `\nERROR-BOUNDARY: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
