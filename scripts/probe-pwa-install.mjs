import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'https://omni.sparkafrika.online';
let failures = 0;
const pass = (m) => console.log(`PASS ${m}`);
const fail = (m) => { failures++; console.log(`FAIL ${m}`); };

async function openMenuAndInstall(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  await page.evaluate(() => { [...document.querySelectorAll('.navpill button')].find((x) => /Menu/.test(x.querySelector('.sr-only')?.textContent || ''))?.click(); });
  await page.waitForTimeout(1200);
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.menuitem')].find((x) => /Installer Omni/.test(x.textContent || ''));
    if (!btn) return 'not-found';
    btn.click();
    return 'clicked';
  });
  await page.waitForTimeout(1000);
  return clicked;
}

// 1) Desktop/Android-like : le menu propose « Installer Omni », la feuille guide s'ouvre.
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const clicked = await openMenuAndInstall(page);
  if (clicked === 'clicked') pass('desktop : « Installer Omni » présent dans le menu et cliquable');
  else fail(`desktop : entrée de menu absente (${clicked})`);
  const sheet = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
  if (sheet === 'install') pass('desktop : la feuille « install » s’ouvre');
  else fail(`desktop : feuille inattendue (${sheet})`);
  const hasSteps = await page.evaluate(() => /Installer|écran d’accueil|barre d’adresse/i.test(document.querySelector('[data-sheet="install"]')?.textContent || ''));
  if (hasSteps) pass('desktop : le guide d’installation est rendu');
  else fail('desktop : le guide est vide');
  if (errors.length === 0) pass('desktop : aucune erreur de page');
  else fail(`desktop : erreurs — ${errors.join(' | ')}`);
  await browser.close();
}

// 2) iPhone (Safari) : le guide iOS nomme les gestes réels.
{
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const clicked = await openMenuAndInstall(page);
  if (clicked === 'clicked') pass('iPhone : « Installer Omni » présent (guide iOS)');
  else fail(`iPhone : entrée de menu absente (${clicked})`);
  const text = await page.evaluate(() => document.querySelector('[data-sheet="install"]')?.textContent || '');
  if (/Partager/.test(text) && /écran d’accueil/.test(text) && /Ajouter/.test(text)) pass('iPhone : guide Share → Sur l’écran d’accueil → Ajouter');
  else fail(`iPhone : guide iOS incomplet — « ${text.replace(/\s+/g, ' ').slice(0, 160)} »`);
  await browser.close();
}

// 3) Bandeau proactif : tant qu'Omni est ouvert dans un navigateur, l'installation est
//    proposée SANS passer par le menu (préalable Web Push, surtout iOS). Le clic ouvre
//    le guide ; la croix mémorise le refus et retire le bandeau.
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const banner = await page.evaluate(() => {
    const el = document.querySelector('.installbanner');
    if (!el) return { ok: false };
    const r = el.getBoundingClientRect();
    return { ok: true, w: r.width, h: r.height, text: el.textContent || '' };
  });
  if (banner.ok && banner.w > 120 && banner.h > 20) pass(`bandeau proactif rendu (${Math.round(banner.w)}×${Math.round(banner.h)})`);
  else fail(`bandeau proactif absent (${JSON.stringify(banner)})`);
  if (/Installer Omni/.test(banner.text)) pass('bandeau : le libellé nomme l’installation');
  else fail('bandeau : libellé manquant');
  // Clic sur « Installer » → la feuille guide s'ouvre (pas de bouton mort).
  await page.evaluate(() => { [...document.querySelectorAll('.installbanner button')].find((b) => /Installer/.test(b.textContent || ''))?.click(); });
  await page.waitForTimeout(900);
  const sheet = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
  if (sheet === 'install') pass('bandeau : « Installer » ouvre le guide');
  else fail(`bandeau : clic n’ouvre pas le guide (${sheet})`);
  // Fermeture de la feuille puis refus : le bandeau disparaît durablement.
  await page.evaluate(() => { document.querySelector('[data-sheet="install"] .back')?.click(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { document.querySelector('.installbanner .ib-x')?.click(); });
  await page.waitForTimeout(500);
  const gone = await page.evaluate(() => !document.querySelector('.installbanner'));
  if (gone) pass('bandeau : la croix le retire');
  else fail('bandeau : toujours présent après refus');
  if (errors.length === 0) pass('bandeau : aucune erreur de page');
  else fail(`bandeau : erreurs — ${errors.join(' | ')}`);
  await browser.close();
}

console.log(`\nPWA INSTALL PROBE: ${failures === 0 ? 'PASS' : `FAIL (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
