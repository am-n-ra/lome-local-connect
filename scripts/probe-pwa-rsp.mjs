// Phase C (HO-OMNI-29) — sonde PWA/RSP sandbox : tactile, offline, API offline,
// tablette, polices. Chaque test imprime PASS/FAIL + mesure. Baseline attendue :
// T2/T3 FAIL (SW actuel), T1/T4/T5 informatifs.
import { chromium } from 'playwright';

const PROD = process.env.PROBE_URL || 'https://omni.sparkafrika.online/';
const results = [];
function verdict(id, pass, detail) {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} — ${detail}`);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined });

// T1 — cibles tactiles : chrome app stable (sheets + dock + recherche),
// hors canvas carte (pins natifs MapLibre, hors DOM). État stabilisé.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(PROD, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(6000);
  const small = await page.$$eval('.omni-v13-stage .sheet button, .omni-v13-stage .navpill button, .omni-v13-stage .searchdock button, .omni-v13-stage .fld input, .omni-v13-stage .menuitem', (els) => els
    .map((el) => { const r = el.getBoundingClientRect(); const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40); return { label, h: Math.round(r.height), visible: r.width > 0 && r.height >= 8 }; })
    .filter((e) => e.visible && e.h < 44)
    .slice(0, 12));
  verdict('RSP-1-touch', small.length === 0, small.length === 0 ? '0 cible <44px' : `${small.length} cibles <44px : ${small.map((s) => `${s.label}(${s.h})`).join(', ')}`);
  await context.close();
}

// T4 — tablette 820 : quel monde (carte pleine ? rail ? sheets ?) + capture.
{
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const page = await context.newPage();
  await page.goto(PROD, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000);
  const world = await page.evaluate(() => ({
    desktop: document.body.classList.contains('desktop'),
    mapLeft: getComputedStyle(document.querySelector('.mapbase') || document.body).left,
    bodyWidth: document.body.clientWidth,
  }));
  await page.screenshot({ path: 'docs/nature-way/pre1-proof/tablet-820-phasec.png' }).catch(() => {});
  verdict('RSP-3-tablet', true, `desktop=${world.desktop} mapLeft=${world.mapLeft} body=${world.bodyWidth}px (caractérisation, voir capture)`);
  await context.close();
}

// T5 — polices bloquées : le texte reste-t-il lisible (fallback système) ?
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route('**://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**://fonts.gstatic.com/**', (route) => route.abort());
  await page.goto(PROD, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000);
  const text = await page.evaluate(() => (document.body.innerText || '').length);
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  verdict('RSP-4-fonts', text > 200, `innerText=${text} chars, font=${family.slice(0, 60)}`);
  await context.close();
}

// T2 — offline total : pas de page blanche.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
  const page = await context.newPage();
  await page.goto(PROD, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(3000);
  const text = await page.evaluate(() => (document.body?.innerText || '').trim().length);
  const title = await page.title().catch(() => '');
  verdict('PWA-2-offline', text > 50, `innerText=${text} chars, title="${title}"`);
  await context.close();
}

// T3 — API hors-ligne : erreur honnête, jamais du HTML 200. Le SW doit être
// installé d'abord (visite en ligne), puis coupure, puis appel API.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(PROD, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);
  await context.setOffline(true);
  const probed = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/v2/public/facilities?limit=1');
      const body = await res.text();
      return { status: res.status, html: body.trimStart().startsWith('<'), len: body.length };
    } catch (e) { return { error: String(e).slice(0, 60) }; }
  }).catch((e) => ({ error: `eval-destroyed: ${String(e).slice(0, 40)}` }));
  const honest = probed.error !== undefined || probed.html === false;
  verdict('PWA-3-api-offline', honest, JSON.stringify(probed).slice(0, 120));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
