// T-12 — SPECIES V2 CONFORMANCE AUDIT (redo)
//
// Why this is a redo: the previous T-12 measured the HTML SOURCE with grep. That
// measures strings that may never reach a screen. Proof: it declared characteristic
// #5 "Retrait / livraison" OK by matching `remise:` in the data object, while the
// rendered offer sheet shows only 6 of the 7 characteristics and the word "Retrait"
// never appears on that screen.
//
// This audit renders every sheet in a real browser and asserts over the VISIBLE text.
// Read the state, never infer it.
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const htmlPath = resolve('docs/maquette/omni-species-v2-interactive.html');
const html = readFileSync(htmlPath, 'utf8');
const keys = [...html.matchAll(/SHEETS(?:\.([A-Za-z0-9_-]+)|\[['"]([A-Za-z0-9_-]+)['"]\])\s*=\s*\(\)/g)]
  .map((m) => m[1] || m[2]);

// A decision is audited by rendering one or more sheets and looking for phrases a
// person would actually read. `absent` phrases must NOT appear (honesty guards).
const AUDIT = [
  { id: 'S-01', sheets: ['offer'],
    decide: (t) => {
      // The Seed's seven day-1 characteristics. Quantité and déplétion are ONE
      // characteristic, and Retrait/livraison is one of the seven.
      const seven = {
        'Quantité / déplétion': /Quantité \/ déplétion/.test(t.offer),
        'Unicité': /Unicité/.test(t.offer),
        'Position': /Position/.test(t.offer),
        'Temporalité': /Temporalité/.test(t.offer),
        'Retrait / livraison': /Retrait \/ livraison/.test(t.offer),
        'État': /État/.test(t.offer),
        'Prix': /Prix/.test(t.offer),
      };
      const missing = Object.entries(seven).filter(([, ok]) => !ok).map(([k]) => k);
      if (missing.length) return ['ABSENT', `characteristic(s) not rendered: ${missing.join(', ')}`];
      // Guard against silently reverting to the split Quantité/Déplétion shape.
      if (/\bDéplétion\b/.test(t.offer)) return ['ABSENT-INCOHERENT', 'Quantité and Déplétion are rendered as two separate rows; the Seed counts them as one'];
      return ['OK', 'the seven day-1 characteristics are rendered, incl. Retrait / livraison'];
    } },
  { id: 'S-05', sheets: ['results', 'facility-apex', 'seller-claim'],
    decide: (t) => {
      const hit = ['results', 'facility-apex', 'seller-claim'].filter((k) => /Lieu connu/i.test(t[k]) && /revendiqu/i.test(t[k]));
      return hit.length ? ['OK', `unclaimed place stated in ${hit.join(', ')}`] : ['ABSENT', 'no rendered "Lieu connu" + Revendiquer'];
    } },
  { id: 'S-06', sheets: ['offer', 'results'],
    decide: (t) => {
      const levels = /Niveau d’existence|Niv\.\s*\d/i.test(t.offer) && /Niv\.\s*\d/i.test(t.results);
      return levels ? ['OK', 'existence level rendered on offer + results'] : ['ABSENT', 'no rendered level line'];
    } },
  { id: 'S-07', sheets: ['search'],
    decide: (t, p) => {
      // The map filters are rendered OUTSIDE the sheet mount (renderFilters()), so they
      // only exist in the full viewport text. Measuring only the sheet would repeat the
      // source-grep mistake in reverse: a real surface declared absent.
      const ok = ['Tout', 'Commerces', 'Particuliers', 'Transport'].every((f) => p.search.includes(f));
      return ok ? ['OK', 'map/search filters rendered on the viewport'] : ['ABSENT', 'filter labels missing on search'];
    } },
  { id: 'S-10', sheets: ['offer', 'results'],
    decide: (t) => {
      // An intangible offer must exist AND must not offer a route.
      const immaterial = /visio|en ligne|digital/i.test(t.results) || /visio|en ligne|digital/i.test(t.offer);
      const originShown = /origine|d’où|d'où/i.test(t.results) || /origine|d’où|d'où/i.test(t.offer);
      if (!immaterial) return ['ABSENT', 'no intangible offer rendered'];
      if (!originShown) return ['PARTIELLE', 'intangible offer rendered but geographic origin not stated'];
      return ['OK', 'intangible offer rendered and its origin is stated'];
    } },
  { id: 'S-11', sheets: ['search', 'entity-empty', 'entite-publique'],
    decide: (t) => {
      const selector = /Chercher\s+(une entité|une offre)/i.test(t.search);
      const page = t['entite-publique'].length > 100;
      if (!selector) return ['ABSENT', 'no rendered entity/offer level selector'];
      if (!page) return ['PARTIELLE', 'selector present but no public entity page'];
      return ['OK', 'two search levels rendered (entity / offer) + public entity page'];
    } },
  { id: 'S-14', sheets: ['seller-verif', 'offer'],
    decide: (t) => {
      const byVolume = /1 vente|3 ventes|particulier|commerce/i.test(t['seller-verif']);
      return byVolume ? ['OK', 'verification threshold stated by volume'] : ['ABSENT', 'no rendered volume-based threshold'];
    } },
  { id: 'S-18', sheets: ['seller-claim'],
    decide: (t) => {
      const proof = /preuve/i.test(t['seller-claim']) && /(contr[oô]le|document|contact)/i.test(t['seller-claim']);
      const arb = /op[ée]rateur|arbitrage|examen/i.test(t['seller-claim']);
      if (!proof) return ['ABSENT', 'claim has no proof of control'];
      if (!arb) return ['PARTIELLE', 'proof present but no operator arbitration stated'];
      return ['OK', 'claim requires proof of control + operator arbitration'];
    } },
  { id: 'S-19', sheets: ['seller-publish', 'offer'],
    decide: (t) => {
      const promo = /remise|avantage|promo/i.test(t['seller-publish']);
      return promo ? ['OK', 'promotional advantage required to publish'] : ['ABSENT', 'no rendered promo requirement'];
    } },
  { id: 'S-20', sheets: ['seller-publish', 'offer'],
    decide: (t) => {
      const vis = /visuel|photo|image/i.test(t['seller-publish']) || /🍝|🛋|📷/u.test(t.offer);
      return vis ? ['OK', 'visuals required / shown'] : ['ABSENT', 'no rendered visual requirement'];
    } },
  { id: 'S-22', sheets: ['qr'],
    decide: (t) => {
      const channels = /whatsapp|sms/i.test(t.qr) && /partag/i.test(t.qr);
      return channels ? ['OK', 'QR circulates by several channels'] : ['ABSENT', 'no rendered off-Omni sharing'];
    } },
  { id: 'S-25', sheets: ['offer'],
    decide: (t) => {
      const owns = /appartient à/i.test(t.offer) && /jamais à qui/i.test(t.offer);
      return owns ? ['OK', 'ownership of the offer by the ENTITY is explicit'] : ['ABSENT', 'ownership not explicit on the offer'];
    } },
  { id: 'S-27', sheets: ['seller-chat', 'txn-track'],
    decide: (t) => {
      // The seller must own the validation surface; the buyer must be TOLD, not given
      // the seller's scanner. Measured on what each side actually renders.
      const sellerActions = /ACTIONS DE CETTE TRANSACTION/i.test(t['seller-chat']);
      const buyerTold = /Le vendeur a validé mon code|valid[ée]/i.test(t['txn-track']);
      const buyerHasScanner = /scanner le code acheteur/i.test(t['txn-track']);
      if (!sellerActions) return ['ABSENT', 'no seller-side transaction surface rendered'];
      if (buyerHasScanner) return ['ABSENT', 'buyer-side screen exposes the seller scanner'];
      if (!buyerTold) return ['PARTIELLE', 'seller surface present but buyer not told of validation'];
      return ['OK', 'seller-side validation surface + buyer told; buyer never given the scanner'];
    } },
  { id: 'S-29', sheets: ['seller-entry'],
    decide: (t) => {
      const ok = /(cr[ée]er|revendiquer)/i.test(t['seller-entry']);
      return ok ? ['OK', 'progressive seller space (create / claim entry)'] : ['ABSENT', 'no rendered seller entry'];
    } },
  { id: 'S-32', sheets: ['offer'],
    decide: (t) => {
      const integ = /intégrité de l’offre/i.test(t.offer);
      const rep = /réputation de l’offre/i.test(t.offer);
      if (!integ && !rep) return ['ABSENT', 'neither integrity nor reputation rendered'];
      if (!integ || !rep) return ['PARTIELLE', `integrity=${integ} reputation=${rep}`];
      return ['OK', 'integrity and reputation of the offer both rendered'];
    } },
  { id: 'economy', sheets: ['seller-offers', 'seller-pro'],
    decide: (t) => {
      // The free ceiling lives on the offers screen, the bonus on the Pro screen. The
      // first pass looked on seller-publish and declared the ceiling absent - the surface
      // was real, my sheet list was wrong.
      // Concatenate the two places the ceiling is stated and assert the exact string, so a
      // numeric regression (e.g. 3/20 -> 3/50) cannot hide behind a loose word match.
      const ceiling = /3 \/ 20 \(gratuit\)/i.test(t['seller-offers']);
      const bonus = /3 ventes à des acheteurs distincts/i.test(t['seller-pro']);
      if (!ceiling) return ['ABSENT', 'free ceiling not stated'];
      if (!bonus) return ['PARTIELLE', 'ceiling stated but distinct-buyer bonus not stated'];
      return ['OK', 'free ceiling (3 / 20) + distinct-buyer bonus stated'];
    } },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });

const rendered = {};
const viewport = {};
for (const key of keys) {
  await page.evaluate((k) => window.go(k), key);
  rendered[key] = await page.evaluate(() => {
    const t = (document.querySelector('#sheetmount')?.innerText || '')
      .replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
    return t;
  });
  // Some surfaces (the map filters) render outside the sheet mount; measure the whole
  // viewport too so a real surface is never declared absent.
  viewport[key] = await page.evaluate(() =>
    (document.body.innerText || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim());
}
await browser.close();

const results = [];
for (const a of AUDIT) {
  const [verdict, evidence] = a.decide(rendered, viewport);
  results.push({ id: a.id, sheets: a.sheets, verdict, evidence });
}

const line = (r) => `  ${r.verdict.padEnd(16)} ${r.id.padEnd(8)} ${r.evidence}`;
console.log(`T-12 CONFORMANCE — rendered ${keys.length} sheets\n`);
for (const r of results) console.log(line(r));

const bad = results.filter((r) => r.verdict !== 'OK');
console.log(`\n${results.length - bad.length}/${results.length} conforme · ${bad.length} non conforme`);
writeFileSync(resolve('.agent_tmp/t12-audit.json'), JSON.stringify({ keys: keys.length, results, rendered }, null, 2));
