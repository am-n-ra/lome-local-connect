import { chromium } from 'playwright';
import { resolve } from 'node:path';

// UI-10 : prouve que le motif de chargement rendu dans la maquette (autorité)
// est réellement monochrome, animé, et coupé en prefers-reduced-motion.
const target = `file://${resolve('docs/maquette/omni-species-v2-interactive.html')}`;
const browser = await chromium.launch({ headless: true });
const fails = [];
const ok = (cond, label, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`); if (!cond) fails.push(label); };

// --- normal motion ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(target, { waitUntil: 'load' });
  await page.evaluate(() => { window.go('state-slow'); });
  await page.waitForTimeout(120);
  const r = await page.evaluate(() => {
    const hcards = document.querySelectorAll('.skel.hcard');
    const kvs = document.querySelectorAll('.skel.kv');
    const first = document.querySelector('.skel');
    const cs = first ? getComputedStyle(first) : null;
    const after = first ? getComputedStyle(first, '::after') : null;
    return {
      hcards: hcards.length,
      kvs: kvs.length,
      bg: cs ? cs.backgroundColor : null,
      shimmerName: after ? after.animationName : null,
      busy: document.querySelectorAll('[aria-busy="true"]').length,
    };
  });
  ok(r.hcards === 3, 'state-slow shows 3 skeleton hcards', `hcards=${r.hcards}`);
  ok(r.kvs === 2, 'state-slow shows 2 skeleton kv lines', `kvs=${r.kvs}`);
  ok(r.bg === 'rgb(247, 247, 247)', 'skeleton uses --panel (monochrome #f7f7f7)', r.bg);
  ok(r.shimmerName === 'skShimmer', 'shimmer animation active', r.shimmerName);
  ok(r.busy >= 2, 'skeleton containers announce aria-busy', `busy=${r.busy}`);
  await page.close();
}

// --- reduced motion ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(target, { waitUntil: 'load' });
  await page.evaluate(() => { window.go('state-slow'); });
  await page.waitForTimeout(120);
  const name = await page.evaluate(() => {
    const first = document.querySelector('.skel.shimmer');
    return first ? getComputedStyle(first, '::after').animationName : 'missing';
  });
  ok(name === 'none', 'shimmer disabled under prefers-reduced-motion', name);
  await page.close();
}

await browser.close();
console.log(fails.length ? `\nUI-10 FAIL (${fails.length})` : '\nUI-10 OK: skeleton motif rendered, monochrome, reduced-motion safe.');
process.exit(fails.length ? 1 : 0);
