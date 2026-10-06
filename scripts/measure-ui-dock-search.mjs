import { chromium } from 'playwright';

// Mesure (pas inférence) : dock, rolepill, barre de recherche + options, menu.
// Parcours public (buyer) mesurable sans session ; les rôles authentifiés sont
// comparés code↔maquette séparément (le sandbox n'a pas de session).
const BASE = process.env.APP_URL || 'http://localhost:4181';
const widths = [390, 768, 1280, 1920];
const browser = await chromium.launch({ headless: true });
const out = {};

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const rolepill = await page.$$eval('.rolepill button', (bs) =>
    bs.map((b) => ({ label: b.textContent.trim(), on: b.classList.contains('on') })));
  const dock = await page.$$eval('.navpill button', (bs) =>
    bs.map((b) => {
      const r = b.getBoundingClientRect();
      const svg = b.querySelector('svg');
      const sr = b.querySelector('.sr-only');
      return {
        name: (b.getAttribute('title') || sr?.textContent || '').trim(),
        w: Math.round(r.width), h: Math.round(r.height),
        center: b.classList.contains('center'), active: b.classList.contains('active'),
        icon: svg ? { w: Math.round(svg.getBoundingClientRect().width), h: Math.round(svg.getBoundingClientRect().height) } : null,
        // le label humain est-il peint (défaut a11y) ou sr-only ?
        srOnly: sr ? getComputedStyle(sr).position === 'absolute' : null,
      };
    }));

  // Ouvre la barre de recherche (dock « Recherche »).
  const opened = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.navpill button')].find((b) => /Recherche/.test(b.getAttribute('title') || b.querySelector('.sr-only')?.textContent || ''));
    if (btn) { btn.click(); return true; }
    return false;
  });
  await page.waitForTimeout(400);
  const searchSheet = await page.evaluate(() => {
    const sheet = document.querySelector('[data-sheet="search"], .searchdock, .sheet');
    return {
      present: !!document.querySelector('.searchdock'),
      hasSearchLevel: !!document.querySelector('.chiprow'),
    };
  });
  // tape une requête pour révéler les contraintes (divulgation progressive)
  await page.evaluate(() => {
    const input = document.querySelector('.searchdock input, input#q, .fld input');
    if (input) { input.focus(); }
  });
  await page.keyboard.type('boulangerie');
  await page.waitForTimeout(600);
  const options = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.searchdock .chip, .chips .chip')].map((c) => c.textContent.replace(/\s+/g, ' ').trim());
    const inputs = [...document.querySelectorAll('.searchdock input')].map((i) => i.getAttribute('aria-label') || i.placeholder || '');
    const groups = [...document.querySelectorAll('.searchdock .eyebrow, .searchdock [class*=group]')].map((g) => g.textContent.replace(/\s+/g, ' ').trim());
    return { chips: [...new Set(chips)], inputs: [...new Set(inputs)], groups: [...new Set(groups)].slice(0, 8) };
  });

  out[width] = { rolepill, dock, searchOpened: opened, searchSheet, options };

  // Desktop layout + menu.
  const layout = await page.evaluate(() => {
    const np = document.querySelector('.navpill');
    const r = np?.getBoundingClientRect();
    const cs = np ? getComputedStyle(np) : null;
    const rail = document.getElementById('rail');
    return {
      navpill: cs ? { flexDirection: cs.flexDirection, position: cs.position, left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null,
      railPresent: !!rail,
    };
  });
  const menu = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.navpill button')].find((b) => /Menu/.test(b.getAttribute('title') || b.querySelector('.sr-only')?.textContent || ''));
    if (btn) btn.click();
    return null;
  });
  await page.waitForTimeout(350);
  const menuItems = await page.$$eval('[data-sheet="menu"] .menuitem b', (bs) => bs.map((b) => b.textContent.trim())).catch(() => []);
  const searchLabels = await page.$$eval('.constraint-zone .label', (ls) => ls.map((l) => l.textContent.trim())).catch(() => []);
  out[width].layout = layout;
  out[width].menuItems = menuItems;
  out[width].searchLabels = searchLabels;
  await page.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
