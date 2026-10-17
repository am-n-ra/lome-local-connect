import { chromium } from 'playwright';

/**
 * GR-2 (mesure) — que se passe-t-il quand on RECHARGE sur la feuille résultats ?
 * `nav-state` restaure la feuille `results` mais la recherche vit en mémoire :
 * la feuille doit-elle s'ouvrir VIDE (mensonge : « 0 résultat ») ou rejouer la requête ?
 */
const TARGET = process.env.TARGET || 'http://localhost:4173';
const target = TARGET;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 140)));
await page.route('**/auth/get-session', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': target, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ user: { id: 'proof-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' }, session: { user: { id: 'proof-buyer' } } }) }));
await page.route('**/auth/token', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': target, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }) }));

// On mesure la REQUÊTE RÉSEAU : le preview local n'a pas d'API, donc les cartes valent 0
// dans les deux cas. La preuve décisive est que la recherche REPART au rechargement.
const searches = [];
page.on('request', (r) => {
  const u = r.url();
  if (/\/api\/v2\/public\/(facilities|entities)/.test(u) && /[?&]q=/.test(u)) searches.push(u);
});

await page.addInitScript(() => { try { localStorage.setItem('omni-map-guide-seen', '1'); } catch {} });
await page.goto(TARGET, { waitUntil: 'load' });
await page.waitForTimeout(5000);

await page.locator('[data-spot="dock"] button').first().click().catch(() => {});
await page.waitForTimeout(600);
const input = page.locator('.searchdock input, input[type="search"], .fld input').first();
await input.fill('pain').catch(async () => { await page.keyboard.type('pain'); });
await page.keyboard.press('Enter');
// La révélation (globe → rue) doit se TERMINER avant que la feuille résultats s'ouvre :
// sur prod elle prend ~8 s, on attend le vrai signal plutôt qu'une durée fixe.
await page.waitForSelector('section[data-sheet="results"]', { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(1500);

const nav = await page.evaluate(() => { try { return localStorage.getItem('omni-nav-state'); } catch { return null; } });
console.log('APRÈS RECHERCHE : requêtes q= =', searches.length, '| nav =', nav);

searches.length = 0;
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('section[data-sheet="results"]', { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(1500);

const after = await page.evaluate(() => ({
  sheet: document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'),
  cards: document.querySelectorAll('section[data-sheet="results"] .hcard').length,
}));
console.log('APRÈS RECHARGEMENT : requêtes q= =', searches.length, '| sheet =', after.sheet);
console.log('   ', searches.map((u) => (u.split('/api')[1] ?? '').slice(0, 90)).join('\n    '));
console.log(
  searches.length > 0 && /[?&]q=pain/.test(searches[0])
    ? '>>> GR-2 CORRIGÉ : la recherche est REJOUÉE au retour (q=pain), la feuille n’est pas vide.'
    : '>>> GR-2 NON CORRIGÉ : aucune recherche rejouée → feuille vide (faux « aucun résultat »).',
);
await browser.close();

