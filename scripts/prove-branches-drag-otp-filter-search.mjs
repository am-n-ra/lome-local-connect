import { chromium } from 'playwright';

const target = process.env.TARGET || 'https://omni.sparkafrika.online';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 780 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(target, { waitUntil: 'load' });
await p.waitForTimeout(3500);

// BRANCH-3 — the 4 category chips sit on ONE line (same y).
const chips = await p.$$eval('.filterrail .fchip', (els) => els.map((e) => {
  const r = e.getBoundingClientRect();
  return { t: e.textContent.trim(), y: Math.round(r.top), x: Math.round(r.left) };
}));
const ys = [...new Set(chips.map((c) => c.y))];
console.log('BRANCH-3 chips:', JSON.stringify(chips));
console.log('BRANCH-3 same-line:', ys.length === 1 && chips.length === 4 ? 'PASS' : 'FAIL', `(${chips.length} chips, ${ys.length} distinct y)`);

// BRANCH-1 — a mobile sheet is dismissed by dragging its handle down.
await p.evaluate(() => {
  const btn = [...document.querySelectorAll('.navpill button, #rail button')].find((b) => /Recherche/.test(b.textContent || ''));
  btn?.click();
});
await p.waitForTimeout(600);
const sheetBox = await (await p.$('.sheet[data-sheet="search"]'))?.boundingBox();
let drag = 'no-sheet';
if (sheetBox) {
  const x = sheetBox.x + sheetBox.width / 2;
  const y0 = sheetBox.y + 12;
  await p.mouse.move(x, y0);
  await p.mouse.down();
  // Stay INSIDE the viewport: dragging past the bottom edge loses pointer events.
  for (let i = 1; i <= 8; i++) { await p.mouse.move(x, y0 + i * 20); await p.waitForTimeout(15); }
  await p.mouse.up();
  await p.waitForTimeout(600);
  const still = await p.$$eval('.sheet[data-sheet="search"]', (e) => e.length);
  drag = still === 0 ? 'PASS' : 'FAIL (sheet still open)';
}
console.log('BRANCH-1 drag-dismiss:', drag);

// BRANCH-4 — a search submitted with NO account opens auth instead of returning results.
await p.evaluate(() => {
  const btn = [...document.querySelectorAll('.navpill button, #rail button')].find((b) => /Recherche/.test(b.textContent || ''));
  btn?.click();
});
await p.waitForSelector('.sheet[data-sheet="search"]', { timeout: 5000 });
await p.waitForTimeout(300);
await p.fill('input[aria-label="Recherche"]', 'boulangerie');
await p.keyboard.press('Enter');
await p.waitForTimeout(900);
const authOpen = await p.$$eval('.sheet[data-sheet="auth"]', (e) => e.length);
const resultsOpen = await p.$$eval('.sheet[data-sheet="results"]', (e) => e.length);
console.log('BRANCH-4 gate:', authOpen > 0 && resultsOpen === 0 ? 'PASS' : `FAIL (auth=${authOpen} results=${resultsOpen})`);

console.log('pageerrors:', errors.length);
await b.close();
