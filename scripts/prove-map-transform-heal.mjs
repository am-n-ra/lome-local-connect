// HP-1 — preuve que le catch de transform MapLibre est INSTALLÉ dans l'app réelle et
// qu'il ne se trompe pas de cible.
//
// La panne réelle est intermittente (timing des transitions caméra) ; on ne parie donc pas
// sur sa reproduction. On prouve le MÉCANISME sur l'app servie, dans les deux sens :
//   P1 un événement `error` de signature transform est intercepté (defaultPrevented=true)
//      → le flood serait coupé et la caméra re-ancrée ;
//   P2 un événement `error` générique (non-transform) N'EST PAS avalé (defaultPrevented=false)
//      → une vraie erreur applicative reste visible.
// Puis on tente la reproduction réelle (informative, jamais bloquante).
import { chromium } from 'playwright';

const TARGET = process.env.URL || 'http://localhost:4173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const realErrors = [];
page.on('pageerror', (e) => realErrors.push((e.stack || String(e)).split('\n')[0]));

await page.goto(TARGET, { waitUntil: 'load' });
await page.waitForTimeout(5000);

const p1 = await page.evaluate(() => {
  const ev = new ErrorEvent('error', {
    message: "TypeError: Cannot read properties of null (reading '0')\n    at _calcMatrices (maplibre-gl.js:1)",
    cancelable: true,
  });
  window.dispatchEvent(ev);
  return ev.defaultPrevented;
});

const p2 = await page.evaluate(() => {
  const ev = new ErrorEvent('error', { message: 'Failed to fetch', cancelable: true });
  window.dispatchEvent(ev);
  return ev.defaultPrevented;
});

let failures = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { failures += 1; console.log(`FAIL  ${m}`); };

if (p1 === true) pass('P1 signature transform interceptée (defaultPrevented=true)');
else fail(`P1 signature transform NON interceptée (defaultPrevented=${p1})`);

if (p2 === false) pass('P2 erreur générique non avalée (defaultPrevented=false)');
else fail(`P2 erreur générique AVALÉE à tort (defaultPrevented=${p2})`);

console.log(`NOTE  erreurs réelles captées pendant la charge : ${realErrors.length}`);
for (const e of realErrors.slice(0, 3)) console.log(`      ${e}`);

await browser.close();
console.log(failures === 0 ? '\nMAP-TRANSFORM-HEAL: PASS' : `\nMAP-TRANSFORM-HEAL: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
