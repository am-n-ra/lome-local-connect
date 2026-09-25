import { chromium } from 'playwright';
import { resolve } from 'node:path';

const target = `file://${resolve('docs/maquette/omni-species-v2-interactive.html')}`;
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.evaluate(() => go('search'));
await p.waitForTimeout(200);

const read = () => p.evaluate(() => {
  const sheet = document.querySelector('[data-sheet=search], .sheet');
  const seuils = [...document.querySelectorAll('.chip.seuil')].map((el) => ({
    text: el.innerText.replace(/\s+/g, ' ').trim(),
    value: el.querySelector('.seuil-v')?.value,
    on: el.classList.contains('on'),
  }));
  const groups = [...document.querySelectorAll('.cgroup .eyebrow')].map((e) => e.innerText.trim());
  return { seuils, groups };
});

console.log('T1 — seuils rendus et éditables');
console.log('   ', JSON.stringify(await read()));

// T2 — edit the budget value: the sheet must show the NEW value, not 2 000
await p.evaluate(() => setSeuil('budget', '1500'));
await p.waitForTimeout(150);
console.log('T2 — après setSeuil(budget, 1500)');
console.log('   ', JSON.stringify((await read()).seuils));

// T3 — the availability sheet must READ the active constraint
await p.evaluate(() => { setSeuil('qte', '7'); toggleC('qte'); });
await p.waitForTimeout(150);
await p.evaluate(() => go('avail'));
await p.waitForTimeout(200);
const avail = await p.evaluate(() => {
  const t = document.body.innerText.replace(/\s+/g, ' ');
  return {
    header: (t.match(/Spaghetti 500 g · \d+/) || [])[0],
    qte: (t.match(/Quantité souhaitée (\d+)/) || [])[1],
    budget: (t.match(/Budget max ([\d  ]+ F|—)/) || [])[1],
  };
});
console.log('T3 — la fiche LIT la contrainte active (attendu 7 / 1 500 F)');
console.log('   ', JSON.stringify(avail));

// T4 — junk input must not produce NaN
await p.evaluate(() => go('search'));
await p.waitForTimeout(150);
await p.evaluate(() => setSeuil('budget', 'abc'));
await p.waitForTimeout(150);
const junk = await p.evaluate(() => document.querySelector('.chip.seuil .seuil-v')?.value);
console.log('T4 — entrée invalide « abc » → valeur =', JSON.stringify(junk));

// T5 — a threshold is NOT toggled by typing (stopPropagation)
await p.evaluate(() => { S.constraints.budget = true; render(); });
await p.waitForTimeout(150);
await p.click('.chip.seuil .seuil-v');
await p.waitForTimeout(150);
const stillOn = await p.evaluate(() => S.constraints.budget);
console.log('T5 — cliquer dans le champ ne désactive PAS la contrainte → budget on =', stillOn);

// T6 — no distance duplicate, Transactable gone
const searchText = await p.evaluate(() => {
  go('search');
  return new Promise((r) => setTimeout(() => r(document.body.innerText.replace(/\s+/g, ' ')), 200));
});
console.log('T6 — « ≤ 10 km » dans la recherche ?', searchText.includes('≤ 10 km'));
console.log('     « Transactable » dans la recherche ?', searchText.includes('Transactable'));

console.log('\npageerrors:', errors.length ? errors : 'none');
await p.screenshot({ path: '/tmp/constraints.png', fullPage: true });
await b.close();
