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
  { id: 'S-04', sheets: ['seller-publish'],
    decide: (t) => {
      // No orphan offers: publishing must name the owning ENTITY right there.
      const names = /Cette offre appartient à/.test(t['seller-publish']) && /entité/i.test(t['seller-publish']);
      return names ? ['OK', 'publishing names the owning entity (no orphan offer)'] : ['ABSENT', 'the publish screen never names the owning entity'];
    } },
  { id: 'S-03', sheets: ['entite-publique'],
    decide: (t) => {
      const owns = /Ses offres/.test(t['entite-publique']);
      const named = /Spaghetti 500 g/.test(t['entite-publique']) && /Huile 1 L/.test(t['entite-publique']);
      return owns && named ? ['OK', 'the mother entity lists its own offers'] : ['ABSENT', `owns=${owns} named=${named}`];
    } },
  { id: 'S-21', sheets: ['scan-entity', 'entity-from-qr'],
    decide: (t) => {
      const qr = /QR/.test(t['scan-entity']) && /remise Omni/i.test(t['scan-entity']);
      const gain = /avantages Omni/i.test(t['entity-from-qr']) && /−15 %|[0-9]+ %/.test(t['entity-from-qr']);
      return qr && gain ? ['OK', 'in-store public QR opens the entity with the Omni discount'] : ['ABSENT', `qr=${qr} gain=${gain}`];
    } },
  { id: 'S-24', sheets: ['scan-entity', 'seller-scan', 'room'],
    decide: (t) => {
      const buyerScans = /Scanner le QR d’une entité/.test(t['scan-entity']);
      const sellerScans = /Scanner le code de l’acheteur/.test(t['seller-scan']);
      // Asymmetry: the buyer must NEVER be shown the seller's scanning screen.
      const leaked = /Scanner le code de l’acheteur|dashboard vendeur/i.test(t['room']);
      if (leaked) return ['ABSENT-INCOHERENT', 'the buyer surface exposes the seller scan/dashboard'];
      return buyerScans && sellerScans ? ['OK', 'buyer scans entities; seller scans buyers; asymmetry kept'] : ['ABSENT', `buyer=${buyerScans} seller=${sellerScans}`];
    } },
  { id: 'S-30', sheets: ['entite-publique', 'seller-verif'],
    decide: (t) => {
      // The Seed's rule: trust belongs to the ENTITY, never the offer. Both surfaces
      // must say it; and the offer sheet must NOT claim a trust of its own.
      const stated = /confiance.*entité|propre à l’entité/i.test(t['entite-publique'] + ' ' + t['seller-verif']);
      const onOffer = /confiance/i.test(t['offer'] || '');
      if (!stated) return ['ABSENT', 'no rendered entity-trust statement'];
      if (onOffer) return ['ABSENT-INCOHERENT', 'the offer sheet also claims a trust of its own'];
      return ['OK', 'trust is stated as the ENTITY’s, never the offer’s'];
    } },
  { id: 'S-31', sheets: ['seller-verif'],
    decide: (t) => {
      const publishesUnverified = /publiez déjà/.test(t['seller-verif']) && /Non vérifié/.test(t['seller-verif']);
      return publishesUnverified ? ['OK', 'publishing precedes verification (S-31)'] : ['ABSENT', 'seller-verif does not state publish-before-verify'];
    } },
  { id: 'S-09', sheets: ['compare', 'offer', 'results'],
    decide: (t) => {
      // "Le prix compte" = the price is VISIBLE and COMPARABLE without touring shops.
      const comparable = /Prix/.test(t['compare']) && /850 F/.test(t['compare']) && /1 000 F/.test(t['compare']);
      const visible = /F\b/.test(t['offer']) && /Prix/.test(t['offer']);
      return comparable && visible ? ['OK', 'prices are visible and comparable side by side'] : ['ABSENT', `comparable=${comparable} visible=${visible}`];
    } },
  { id: 'S-13', sheets: ['seller-entity', 'entite-publique'],
    decide: (t) => {
      // One object for every offeror: commerce, organisation OR a single person.
      const choices = ['Commerce', 'Particulier', 'Organisation'].every((k) => t['seller-entity'].includes(k));
      const sameObject = /même objet/i.test(t['seller-entity'] + ' ' + t['entite-publique']);
      return choices && sameObject ? ['OK', 'commerce / organisation / particulier share one entity object'] : ['ABSENT', `choices=${choices} sameObject=${sameObject}`];
    } },
  { id: 'S-16', sheets: ['auth'],
    decide: (t) => {
      const phoneFirst = /Téléphone-first/.test(t['auth']) && /numéro avant l’e-mail/.test(t['auth']);
      const channels = /OTP Neon Auth/.test(t['auth']) && /WhatsApp/.test(t['auth']) && /SMS payant exclu/.test(t['auth']);
      return phoneFirst && channels ? ['OK', 'phone-first sign-in; OTP email + WhatsApp; paid SMS excluded'] : ['ABSENT', `phoneFirst=${phoneFirst} channels=${channels}`];
    } },
  { id: 'S-17', sheets: ['seller-entity', 'seller-verif', 'entite-publique', 'results'],
    decide: (t) => {
      // The three tiers are stated ACROSS surfaces, not on one screen:
      //   0/1 Joignable / numéro confirmé -> seller-entity (N° joignable · confirmé)
      //   2   Vérifié par opérateur       -> seller-verif (opérateur assigné, visite terrain)
      //   3   Prouvé par usage            -> entite-publique (Vérifiée · 12 ventes)
      // Reading only seller-verif declared a real surface absent — the reverse of the
      // source-grep mistake. Measure the tier where it is actually rendered.
      const tier01 = /joignable/i.test(t['seller-entity']) && /confirmé/i.test(t['seller-entity']);
      const tier2 = /Opérateur assigné/.test(t['seller-verif']) && /Visite terrain/.test(t['seller-verif']);
      const tier3 = /Vérifiée · 12 ventes/.test(t['entite-publique']);
      const unverifiedBadge = /Non vérifié/.test(t['seller-verif']);
      if (!(tier01 && tier2 && tier3 && unverifiedBadge)) {
        return ['ABSENT', `tier01=${tier01} tier2=${tier2} tier3=${tier3} unverified=${unverifiedBadge}`];
      }
      return ['OK', 'tiers 0/1 joignable → 2 operator → 3 proven by usage, all rendered'];
    } },
  { id: 'S-28', sheets: ['seller-entity', 'seller-entry'],
    decide: (t) => {
      // Always create an entity, even for a single-object individual — one path only.
      // The eyebrow is uppercased by CSS, so match case-insensitively (innerText is rendered case).
      const oneStep = /étape 1 · votre entité/i.test(t['seller-entity']);
      const individual = /particulier crée une entité/i.test(t['seller-entity']);
      const noSecondPath = !/particulier sans entité|sans créer d’entité/i.test(t['seller-entry']);
      if (!noSecondPath) return ['ABSENT-INCOHERENT', 'a second path exists for individuals without an entity'];
      return oneStep && individual ? ['OK', 'always create an entity; the individual IS the entity, one path'] : ['ABSENT', `oneStep=${oneStep} individual=${individual}`];
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
// A non-conformant decision must fail the command, not just print a line.
if (bad.length) process.exitCode = 1;

// --- COH-V2-18 fix: the denominator must be the SEED, not this audit's subset ---
// The previous run printed "16/16 conforme" while the Seed holds 34 decisions: the
// subset was choosing its own denominator, so unmeasured decisions looked conformant.
// Read the Seed and report EVERY decision's class. `rendered` means the specific
// phrase was actually read on a screen; `code`/`rule` are model constraints that
// have no screen to render; anything else is honestly UNMEASURED.
const seed = readFileSync(resolve('docs/nature-way/omni-intent-brief-v2-2026-09-23.md'), 'utf8');
const seedIds = [...new Set([...seed.matchAll(/S-\d{2}/g)].map((m) => m[0]))].sort();
const CLASS = {
  code: ['S-02', 'S-15', 'S-23', 'S-26'],           // model constraint, verified in DB/code
  // Deliberately out of V1 scope by the Seed itself — NOT conformant claims.
  deferred: ['S-08', 'S-12'],                       // transport offer screen / A→B = `V1+`
};
const audited = new Set(results.map((r) => r.id));
const klassOf = (id) => audited.has(id) ? 'rendered'
  : CLASS.code.includes(id) ? 'code'
  : CLASS.deferred.includes(id) ? 'deferred'
  : 'UNMEASURED';
const coverage = seedIds.map((id) => ({ id, klass: klassOf(id) }));
const byClass = coverage.reduce((a, c) => ({ ...a, [c.klass]: (a[c.klass] || 0) + 1 }), {});
const unmeasured = coverage.filter((c) => c.klass === 'UNMEASURED').map((c) => c.id);

console.log(`\nCOUVERTURE SEED — ${seedIds.length} décisions S-xx dans le Seed V2`);
console.log(`  rendu à l'écran : ${(byClass.rendered || 0)}`);
console.log(`  contrainte code : ${(byClass.code || 0)}`);
console.log(`  hors V1 (Seed)  : ${(byClass.deferred || 0)}${(byClass.deferred || 0) ? ' → ' + CLASS.deferred.join(' ') : ''}`);
console.log(`  NON MESURÉ      : ${(byClass.UNMEASURED || 0)}${unmeasured.length ? ' → ' + unmeasured.join(' ') : ''}`);
console.log(`\n  ⚠️  Un verdict "conforme" ne porte QUE sur les ${byClass.rendered || 0} décisions rendues à l'écran.`);
if (unmeasured.length) console.log(`  ⚠️  ${unmeasured.length} décision(s) du Seed ne sont PROUVÉES PAR AUCUNE MESURE (COH-V2-18).`);
// A run that leaves an UNMEASURED decision must not report an unqualified success.
if (unmeasured.length) process.exitCode = 2;
writeFileSync(resolve('.agent_tmp/t12-audit.json'), JSON.stringify({ keys: keys.length, results, rendered, seed: seedIds, coverage }, null, 2));
