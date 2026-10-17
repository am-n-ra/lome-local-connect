import { chromium } from 'playwright';

/**
 * GR-1 — la bulle du spotlight reste ENTIÈREMENT dans la fenêtre à CHAQUE étape,
 * y compris la 3ᵉ (le dock, collé au bas de l'écran). Bug mesuré 2026-10-15 :
 * étape 3/3 → anneau 766..836, bulle à 840 sur un écran de 844 → 4 px visibles sur 128.
 *
 * Exige un serveur servant le build (TARGET, défaut http://localhost:4173).
 * Le guide est NON BLOQUANT (S-31) : on ne teste que la géométrie de la bulle.
 */
const TARGET = process.env.TARGET || 'http://localhost:4173';
// 390×844 = iPhone 12/13/14 ; 667 = iPhone SE — les deux hauteurs du plan GR-1.
const VIEWPORTS = [
  { w: 390, h: 844 },
  { w: 390, h: 667 },
];

const browser = await chromium.launch({ headless: true });
let pass = 0;
let fail = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` :: ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // Neuf à chaque largeur : le spotlight se déclenche à la première visite.
  await page.addInitScript(() => { try { localStorage.removeItem('omni-map-guide-seen'); } catch {} });
  await page.goto(TARGET, { waitUntil: 'load' });
  await page.waitForTimeout(1800);

  const steps = ['rolepill', 'filterrail', 'dock'];
  for (let i = 0; i < steps.length; i += 1) {
    const spot = steps[i];
    // La bulle doit être là, sur le bon élément.
    const onSpot = await page.locator(`.spotlight[data-spot-step="${spot}"]`).count();
    check(`[${vp.w}×${vp.h}] étape ${i + 1}/3 = ${spot}`, onSpot === 1, `count=${onSpot}`);

    const geom = await page.evaluate(() => {
      const card = document.querySelector('.spotlight-card');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        placement: card.getAttribute('data-placement'),
        winH: window.innerHeight,
      };
    });
    if (!geom) { check(`[${vp.w}×${vp.h}] bulle ${spot} mesurable`, false); break; }

    const visibleTop = Math.max(0, geom.top);
    const visibleBottom = Math.min(geom.winH, geom.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    // Tolérance 1 px : les hauteurs DOM sont fractionnaires (127,4 → arrondi 127).
    const fullyVisible = geom.height - visibleHeight <= 1 && geom.top >= -1 && geom.bottom <= geom.winH + 1;
    check(
      `[${vp.w}×${vp.h}] bulle ${spot} entièrement visible`,
      fullyVisible,
      `top=${geom.top} bottom=${geom.bottom} h=${geom.height} win=${geom.winH} visible=${visibleHeight} placement=${geom.placement}`,
    );

    if (i < steps.length - 1) {
      await page.locator('.spotlight-card .btn.ok').click();
      await page.waitForTimeout(400);
    }
  }
  check(`[${vp.w}×${vp.h}] aucune erreur console`, errors.length === 0, errors.join(' | ').slice(0, 160));
  await page.close();
}

await browser.close();
console.log(`\nGR-1 spotlight proof — ${pass} ok / ${fail} fail`);
process.exitCode = fail === 0 ? 0 : 1;
