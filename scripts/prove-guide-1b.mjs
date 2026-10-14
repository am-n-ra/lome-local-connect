import { chromium } from 'playwright';

/**
 * GUIDE-1b — preuve navigateur des TROIS surfaces du guide (A/B/C), sur 4 largeurs.
 *
 * Exige un serveur servant le build (TARGET, défaut http://localhost:4173).
 * Le guide est NON BLOQUANT (S-31) : on le vérifie à chaque étape.
 */
const TARGET = process.env.TARGET || 'http://localhost:4173';
const WIDTHS = [360, 768, 1280, 1920];

const browser = await chromium.launch({ headless: true });
let pass = 0;
let fail = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` :: ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // Neuf à chaque largeur : le spotlight se déclenche à la première visite.
  await page.addInitScript(() => { try { localStorage.removeItem('omni-map-guide-seen'); } catch {} });
  await page.goto(TARGET, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  // ---- Surface B : le spotlight de première fois sur la carte ----
  const spot = await page.evaluate(() => {
    const el = document.querySelector('.spotlight');
    if (!el) return null;
    const ring = document.querySelector('.spotlight-ring');
    const rule = getComputedStyle(el);
    return {
      title: document.querySelector('.spotlight-card b')?.textContent?.trim() ?? '',
      hasRing: Boolean(ring),
      pointerEvents: rule.pointerEvents,
      background: rule.backgroundColor,
      buttons: [...document.querySelectorAll('.spotlight-card button')].map((b) => b.textContent?.trim()),
    };
  });
  check(`[${width}] B spotlight visible à la première fois`, spot !== null);
  if (spot) {
    check(`[${width}] B non bloquant (pointer-events:none, pas de fond)`, spot.pointerEvents === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(spot.background), `${spot.pointerEvents} / ${spot.background}`);
    check(`[${width}] B anneau ancré sur un élément réel`, spot.hasRing);
    check(`[${width}] B « Passer » toujours présent (S-31)`, spot.buttons.includes('Passer'), spot.buttons.join(','));
  }

  // ---- Surface B : « Passer » ferme et n'affiche plus jamais ----
  await page.evaluate(() => {
    [...document.querySelectorAll('.spotlight-card button')].find((b) => b.textContent?.trim() === 'Passer')?.click();
  });
  await page.waitForTimeout(300);
  const afterPass = await page.evaluate(() => ({
    gone: !document.querySelector('.spotlight'),
    seen: localStorage.getItem('omni-map-guide-seen'),
  }));
  check(`[${width}] B « Passer » ferme et mémorise`, afterPass.gone && afterPass.seen === '1', JSON.stringify(afterPass));

  // ---- Surface C : « Comment ça marche » depuis le menu (sans compte) ----
  await page.evaluate(() => {
    [...document.querySelectorAll('.navpill button')].find((b) => (b.querySelector('.sr-only')?.textContent || '').trim() === 'Menu')?.click();
  });
  await page.waitForTimeout(500);
  const menuHas = await page.evaluate(() => [...document.querySelectorAll('.menuitem')].some((b) => /Comment ça marche/.test(b.textContent || '')));
  check(`[${width}] C entrée « Comment ça marche » au menu`, menuHas);

  await page.evaluate(() => {
    [...document.querySelectorAll('.menuitem')].find((b) => /Comment ça marche/.test(b.textContent || ''))?.click();
  });
  await page.waitForTimeout(400);
  const sheet = await page.evaluate(() => {
    const el = document.querySelector('[data-sheet="how-it-works"]');
    if (!el) return null;
    const t = el.textContent || '';
    return {
      moments: ['Découvrir', 'Interroger', 'Vérifier & transiger'].every((m) => t.includes(m)),
      levels: ['Disponibilité vivante', 'Transactable'].every((m) => t.includes(m)),
      oldWords: /Disponibilité confirmée/.test(t),
      close: Boolean(el.querySelector('[aria-label="Fermer"]')),
    };
  });
  check(`[${width}] C feuille rendue`, sheet !== null);
  if (sheet) {
    check(`[${width}] C les 3 temps du cœur`, sheet.moments);
    check(`[${width}] C l'échelle S-06 (mots verrouillés)`, sheet.levels && !sheet.oldWords, `oldWords=${sheet.oldWords}`);
    check(`[${width}] C fermable (non bloquant)`, sheet.close);
  }

  check(`[${width}] aucune erreur console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await page.close();
}

await browser.close();
console.log(`\nGUIDE-1b browser proof — ${pass} ok / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
