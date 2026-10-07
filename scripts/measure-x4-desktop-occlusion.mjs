import { chromium } from 'playwright';

// X4 — mesure (pas inférence) : sur desktop, QUEL élément d'UI en cache un autre.
// Le fondateur a signalé « des éléments passent encore derrière le role switcher ».
// On ouvre chaque surface atteignable sans session et on teste, par géométrie,
// si un élément interactif/textuel significatif est recouvert par rolepill / navpill /
// la barre de recherche / un drawer, au point de ne plus pouvoir être lu ni touché.
const BASE = process.env.APP_URL || 'http://localhost:4173';
const widths = [1040, 1280, 1920];

const browser = await chromium.launch({ headless: true });
const report = {};

const clickText = async (page, re) => {
  return page.evaluate((src) => {
    const rx = new RegExp(src);
    const btn = [...document.querySelectorAll('.navpill button, .rolepill button, button, .menuitem, .chip')]
      .find((b) => rx.test((b.getAttribute('title') || b.textContent || '').trim()));
    if (btn) { btn.click(); return (btn.getAttribute('title') || btn.textContent || '').trim().slice(0, 40); }
    return null;
  }, re.source);
};

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const surfaces = {};
  // état repos, puis chaque surface publique atteignable sans session
  const steps = [
    ['home', async () => {}],
    ['search', async () => clickText(page, /Recherche|search/i)],
    ['results', async () => { await page.evaluate(() => {
        const f = [...document.querySelectorAll('.navpill button')].find((b)=>/Recherche/.test(b.getAttribute('title')||''));
        f?.click();
      }); await page.waitForTimeout(300);
      await page.evaluate(() => { const i=document.querySelector('.searchdock input,[data-sheet="search"] input'); if(i){i.value='boulangerie'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));} });
      await page.waitForTimeout(1600); }],
    ['menu', async () => clickText(page, /Menu|menu/i)],
    ['account', async () => clickText(page, /Compte|account/i)],
  ];

  for (const [name, act] of steps) {
    try { await act(); } catch {}
    await page.waitForTimeout(500);
    // occlusion : pour chaque élément interactif visible, quel élément est au-dessus au centre ?
    const occluded = await page.evaluate(() => {
      const overlays = ['.rolepill', '.navpill', '.sheet[data-sheet="search"]', '.countmark'];
      const isOverlay = (el) => overlays.some((s) => el.closest(s));
      const results = [];
      const seen = new Set();
      const targets = [...document.querySelectorAll('button, a, input, .chip, .menuitem, .hcard, .pitem, .kv, .searchdock, .constraint-zone')];
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.left < 0 || r.top < 0 || r.bottom > innerHeight || r.right > innerWidth) {
          // hors écran : signalé à part, pas une occlusion
        }
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
        const top = document.elementFromPoint(cx, cy);
        if (!top || el.contains(top) || top.contains(el)) continue;
        // top est un recouvreur ?
        const label = String(el.getAttribute('title') || el.textContent || el.className || '').trim().slice(0, 34);
        const cover = String(top.getAttribute('title') || top.textContent || top.className || '').trim().slice(0, 34);
        const key = `${el.className}|${label}|${cover}`;
        if (seen.has(key)) continue; seen.add(key);
        results.push({ el: label, elClass: String(el.className).slice(0,40), elTag: el.tagName, elHtml: (el.outerHTML||'').slice(0,120), cover, coverClass: String(top.className).slice(0,40), coverTag: top.tagName, coverHtml: (top.outerHTML||'').slice(0,180), coverParent: top.closest('[class]')?.className?.toString?.().slice(0,50) ?? null, overlay: isOverlay(top) || isOverlay(el), cx: Math.round(cx), cy: Math.round(cy) });
      }
      return results;
    });
    // rolepill geometry + ce qu'il recouvre
    const geo = await page.evaluate(() => {
      const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      return { rolepill: g('.rolepill'), navpill: g('.navpill'), search: g('.sheet[data-sheet="search"]'), countmark: g('.countmark') };
    });
    surfaces[name] = { geo, occluded };
  }
  report[width] = surfaces;
  await page.close();
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
