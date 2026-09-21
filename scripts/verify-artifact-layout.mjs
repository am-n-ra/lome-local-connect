import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto('file:///workspace/project/docs/maquette/omni-artifact-design-system.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);

const report = await p.evaluate(() => {
  const out = {};
  const phone = document.querySelector('.phone');
  const pr = phone.getBoundingClientRect();
  out.phone = { w: Math.round(pr.width), h: Math.round(pr.height) };
  out.docOverflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return out;
});

// Mesure écran par écran, ACTIVÉ : un écran en display:none n'a aucune géométrie,
// donc le mesurer quand il est masqué produit de faux débordements.
const tabs = await p.$$('.tab');
const perScreen = [];
for (const tab of tabs) {
  const id = await tab.getAttribute('data-go');
  await tab.click();
  await p.waitForTimeout(250);
  perScreen.push(await p.evaluate((sid) => {
    const phone = document.querySelector('.phone');
    const pr = phone.getBoundingClientRect();
    const s = document.querySelector(`.screen[data-id="${sid}"]`);
    const marks = [...s.querySelectorAll('.pin,.me,.countmark,.routechip')];
    const bad = marks.filter(el => {
      const r = el.getBoundingClientRect();
      // Un marqueur peut légitimement mordre sur le bord (pins ancrés au centre),
      // mais pas dépasser de plus de la moitié de sa taille.
      const over = Math.max(0, pr.left - r.left, r.right - pr.right, pr.top - r.top, r.bottom - pr.bottom);
      const lim = Math.max(r.width, r.height) / 2 + 3;
      return over > lim;
    }).map(el => el.className.split(' ')[0]);
    const sheet = s.querySelector('.sheet');
    const sr = sheet ? sheet.getBoundingClientRect() : null;
    const chip = s.querySelector('.routechip');
    const cr = chip ? chip.getBoundingClientRect() : null;
    return {
      id: sid,
      marks: marks.length,
      horsCadre: bad,
      feuille: sr ? {
        dedans: sr.bottom <= pr.bottom + 1 && sr.left >= pr.left - 1 && sr.right <= pr.right + 1,
        couverture: Math.round(sr.height / pr.height * 100) + '%',
      } : null,
      chip: cr ? { dedans: cr.left >= pr.left - 1 && cr.right <= pr.right + 1 && cr.bottom <= pr.bottom + 1 } : null,
      legende: [...document.querySelectorAll('.caption > div')].filter(d => !d.hidden).map(d => d.id),
    };
  }, id));
}
report.screens = perScreen;

const extra = await p.evaluate(() => {
  const svg = document.querySelector('.map svg');
  return {
    svgPaths: svg.querySelectorAll('path').length,
    fonts: {
      display: getComputedStyle(document.querySelector('.masthead h1')).fontFamily.split(',')[0],
      body: getComputedStyle(document.querySelector('.caption p')).fontFamily.split(',')[0],
      displayChargee: document.fonts.check('800 40px "Plus Jakarta Sans"'),
      bodyChargee: document.fonts.check('400 15px "Hanken Grotesk"'),
    },
    desktop: (() => {
      const d = document.querySelector('.desktop'), dr = d.getBoundingClientRect();
      return { w: Math.round(dr.width), ratioPanneau: Math.round(d.querySelector('.dpanel').getBoundingClientRect().width / dr.width * 100) + '%' };
    })(),
  };
});

console.log(JSON.stringify({ ...report, ...extra }, null, 2));
await b.close();