import { chromium } from 'playwright';

/**
 * BRANCHES-OFFER-VISUAL-3 proof — the BUYER sees the offer visual, on real prod.
 * Signs in (real demo buyer), then drives the real search → fiche and asserts the product rows
 * render a real <img> (naturalWidth > 0) whose src is a demo visual, and that a product WITHOUT
 * a visual keeps the placeholder (no broken <img>).
 */
const PROD = 'https://omni.sparkafrika.online';
const AUTH = 'https://ep-plain-butterfly-amn21o8h.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth';
let pass = 0, fail = 0;
const step = (n, ok, d = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ' :: ' + d : ''}`); ok ? pass++ : fail++; };

const res = await fetch(`${AUTH}/sign-in/email`, { method: 'POST', headers: { 'content-type': 'application/json', Origin: PROD }, body: JSON.stringify({ email: 'demo@buyer.omni', password: 'Omni@2026' }) });
const raw = res.headers.getSetCookie?.() ?? [];
step('sign-in demo@buyer.omni', res.ok && raw.length > 0, `status=${res.status} cookies=${raw.length}`);

const authHost = new URL(AUTH).hostname;
const cookies = raw.map((c) => {
  const [pair, ...attrs] = c.split(';').map((s) => s.trim());
  const [name, ...v] = pair.split('=');
  return { name, value: v.join('='), domain: authHost, path: '/', secure: true, httpOnly: attrs.some((a) => /^httponly$/i.test(a)), sameSite: 'None' };
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies(cookies);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

try {
  await page.goto(PROD, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  await page.locator('.navpill button', { hasText: /echerch/i }).first().click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  const input = page.locator('input[type="search"], input[placeholder*="echerch" i], .fld input').first();
  await input.click({ timeout: 8000 });
  await input.fill('hub');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);

  await page.locator('section[data-sheet="results"] button.hcard', { hasText: 'Omni Demo Seller Hub' }).first().click({ timeout: 8000 });
  await page.waitForTimeout(4000);

  const imgs = page.locator('section[data-sheet="facility"] img.pthumb');
  const count = await imgs.count();
  step('la fiche facilité rend des <img.pthumb>', count > 0, `count=${count}`);

  const srcs = []; let natural = 0;
  for (let i = 0; i < count; i++) {
    const el = imgs.nth(i);
    srcs.push(await el.getAttribute('src'));
    if ((await el.evaluate((n) => n.naturalWidth)) > 0) natural++;
  }
  step('chaque image est réellement chargée (naturalWidth>0)', count > 0 && natural === count, `loaded=${natural}/${count}`);
  const demo = srcs.filter((s) => s && /\/demo\/.*\.png/.test(s));
  step('les visuels démo sont rendus', demo.length >= 3, JSON.stringify(demo));

  const phCount = await page.locator('section[data-sheet="facility"] span.pthumb').count();
  step('les offres sans visuel gardent le placeholder', phCount >= 1, `placeholders=${phCount}`);
} catch (e) {
  step('parcours acheteur sans exception', false, String(e).split('\n')[0].slice(0, 200));
} finally {
  step('aucune erreur console', errors.length === 0, errors.join(' | ').slice(0, 200));
  await browser.close();
}
console.log(`\nRESULT ${pass}/${pass + fail}`);
process.exitCode = fail ? 1 : 0;
