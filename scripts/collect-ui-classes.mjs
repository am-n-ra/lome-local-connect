import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

// Collects every CSS class name actually applied to a rendered element across
// all sheets reachable without auth, at several widths. Output feeds a dead-CSS
// analysis: a class that never appears here AND never appears in source is dead.
const BASE = process.env.UI_BASE ?? 'http://localhost:4181';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const all = new Set();
const perSheet = {};

const collect = async (page) => page.evaluate(() => {
  const s = new Set();
  for (const el of document.querySelectorAll('*')) {
    const c = typeof el.className === 'string' ? el.className : '';
    c.split(/\s+/).filter(Boolean).forEach((x) => s.add(x));
  }
  return [...s];
});

const run = async () => {
  for (const w of [360, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w <= 480 ? 780 : 900 }, locale: 'fr-FR' });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2200);
    const grab = async (name) => { const s = await collect(page); perSheet[`${w}/${name}`] = s; s.forEach((x) => all.add(x)); };
    await grab('home');
    const nav = async (label) => { await page.evaluate((l) => { [...document.querySelectorAll('.navpill button')].find((b) => (b.textContent || '').trim() === l)?.click(); }, label); await page.waitForTimeout(700); };
    await nav('Recherche');
    await grab('search');
    await page.evaluate(() => { const inp = document.querySelector('.searchdock input'); if (inp) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(inp, 'boulangerie'); inp.dispatchEvent(new Event('input', { bubbles: true })); } });
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('form[data-sheet="search"]')?.querySelector('button[type="submit"]')?.click());
    await page.waitForSelector('.hgrid button.hcard', { timeout: 9000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await grab('results');
    await page.evaluate(() => document.querySelector('.hgrid button.hcard')?.click());
    await page.waitForTimeout(1200);
    await grab('facility');
    await nav('Menu');
    await grab('menu');
    await nav('QR'); await page.waitForTimeout(600); await grab('qr');
    await nav('Compte'); await page.waitForTimeout(700); await grab('account');
    await ctx.close();
  }
};
await run();
await browser.close();
writeFileSync('/tmp/ui-classes.json', JSON.stringify({ all: [...all].sort(), perSheet }, null, 2));
console.log(`collected ${all.size} distinct classes across sheets`);
