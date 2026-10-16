// Proof Species V2b — « Entrée & guide ». Mesure le RENDU, pas la lecture du source.
// Une maquette ne se juge pas au goût : on vérifie que les surfaces existent, que les
// atomes portent une taille réelle, et que le guide ENSEIGNE ce qu'il doit enseigner.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FILE = resolve('docs/maquette/omni-species-v2b-entry-guide.html');
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(pathToFileURL(FILE).href);
await page.waitForTimeout(300);

// T1 — l'accueil est un HÉROS, pas un mur de texte.
const hero = await page.evaluate(() => {
  const h = document.querySelector('.hero h2');
  const moments = document.querySelectorAll('.moment').length;
  const svg = document.querySelectorAll('.moment .m-ic svg').length;
  return { title: h ? h.textContent.trim().slice(0, 30) : null, moments, svg };
});
check('T1 welcome : un titre de promesse', hero.title && hero.title.length > 5, `"${hero.title}…"`);
check('T1b welcome : 3 moments avec icône (pas des lignes de texte)',
  hero.moments === 3 && hero.svg === 3, `moments=${hero.moments} svg=${hero.svg}`);

// T2 — les icônes ont une taille RÉELLE (leçon suite 3 : svg sans taille = 300x150).
const iconBox = await page.evaluate(() => {
  const svg = document.querySelector('.moment .m-ic svg');
  const r = svg.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
});
check('T2 les icônes sont dimensionnées (16px, pas 300x150)',
  iconBox.w === 16 && iconBox.h === 16, `${iconBox.w}x${iconBox.h}`);

// T3 — le guide enseigne l'échelle 0→4 avec un VRAI curseur.
await page.click('text=Comment ça marche');
await page.waitForTimeout(250);
const scale = await page.evaluate(() => {
  const bars = document.querySelectorAll('.scale .bars i');
  const top = document.querySelectorAll('.scale .bars i.top').length;
  return { bars: bars.length, top };
});
check('T3 échelle : 5 segments (0→4), le dernier marqué (niveau 4)', scale.bars === 5 && scale.top === 1,
  `bars=${scale.bars} top=${scale.top}`);

// T4 — NR-11 : le guide explique l'automate ET son abstention.
const auto = await page.evaluate(() => {
  const yes = document.querySelectorAll('.cond .c-ic.yes').length;
  const no = document.querySelectorAll('.cond .c-ic.no').length;
  const txt = document.body.innerText;
  return { yes, no, mentionneNegociation: /négoci/i.test(txt), mentionnePerime: /4 heures/i.test(txt) };
});
check('T4 NR-11 : l\'automate est expliqué (2 conditions, 3 abstentions)',
  auto.yes === 2 && auto.no === 3, `yes=${auto.yes} no=${auto.no}`);
check('T4b NR-11 : l\'abstention sur négociation est DITE',
  auto.mentionneNegociation, `négociation=${auto.mentionneNegociation}`);
check('T4c NR-11 : la péremption (4 h) est DITE',
  auto.mentionnePerime, `4h=${auto.mentionnePerime}`);

// T5 — les notifications : où elles vivent, quand on demande la permission.
const notif = await page.evaluate(() => {
  const t = document.body.innerText;
  return { inbox: /Inbox/i.test(t), permission: /permission/i.test(t), apresAction: /après.*action/i.test(t) };
});
check('T5 notifications : l\'Inbox est nommée', notif.inbox);
check('T5b notifications : la permission est située APRÈS une action', notif.permission && notif.apresAction,
  `permission=${notif.permission} apresAction=${notif.apresAction}`);

// T6 — l'accent reste RÉSERVÉ à la confiance (règle design.md §3).
const accent = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('.cardbox, .moment, .hero, .stop').forEach((el) => {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg.includes('46, 139, 111')) bad.push(el.className);
  });
  const okCount = document.querySelectorAll('.cond .c-ic.yes, .status.ok').length;
  return { bad: bad.length, okCount };
});
check('T6 l\'accent n\'est JAMAIS un fond de bloc (réservé confiance)',
  accent.bad === 0, `blocs teintés=${accent.bad} · usages légitimes=${accent.okCount}`);

// T7 — l'échelle du niveau 4 est cohérente avec les mots verrouillés (S-06).
const words = await page.evaluate(() => {
  const t = document.body.innerText;
  return ['Présente', 'Revendiquée', 'Offre publiée', 'Disponibilité vivante', 'Transactable']
    .filter((w) => t.includes(w));
});
check('T7 les 5 mots de l\'échelle (S-06) sont présents', words.length >= 5, words.join(' · '));

// T8 — le spotlight carte est numéroté (progression, pas une liste plate).
await page.click('text=Voir la carte');
await page.waitForTimeout(250);
const stops = await page.evaluate(() => {
  const n = document.querySelectorAll('.stop .s-n').length;
  const rail = !!document.querySelector('.rail-line');
  return { n, rail };
});
check('T8 spotlight : 3 arrêts numérotés sur une ligne de temps', stops.n === 3 && stops.rail,
  `stops=${stops.n} rail=${stops.rail}`);

// T9 — zéro erreur console.
check('T9 aucune erreur console', errors.length === 0, errors.join(' | ').slice(0, 200));

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
if (failed.length) { console.log('ECHEC'); process.exit(1); }
console.log('SPECIES-V2B PROOF OK');
