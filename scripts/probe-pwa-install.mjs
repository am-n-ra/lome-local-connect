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

console.log(`\nPWA INSTALL PROBE: ${failures === 0 ? 'PASS' : `FAIL (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
