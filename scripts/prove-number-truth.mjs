// BRANCHES-GUIDE-1a — preuve « vérité des chiffres » (fondateur 2026-10-14).
// Sans session : l'accueil est public, donc la preuve est publique.
//
// Elle prouve TROIS choses que la lecture du code ne suffit pas à établir :
//   1. le TOTAL public existe et est servi (`/api/v2/public/stats`) ;
//   2. ce total DIFFÈRE du plafond de fenêtre (`/api/v2/public/facilities`, D-MAP-1) —
//      donc lire la liste comme un total était bien un mensonge, pas un détail ;
//   3. le bundle client SERVI contient le libellé honnête et AUCUN littéral périmé.
//
// Usage : node scripts/prove-number-truth.mjs [baseUrl]
import { readFileSync } from 'node:fs';

const baseUrl = (process.argv[2] || 'https://omni.sparkafrika.online').replace(/\/$/, '');
let failures = 0;
const step = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
};

// --- 1. le total public honnête ---
const statsRes = await fetch(`${baseUrl}/api/v2/public/stats`, { headers: { Accept: 'application/json' } });
const stats = await statsRes.json().catch(() => null);
const facilities = stats?.data?.facilities;
step('GET /api/v2/public/stats → 200', statsRes.status === 200, `status=${statsRes.status}`);
step('le total public est un entier > plafond de fenêtre', Number.isInteger(facilities) && facilities > 2000,
  `facilities=${facilities}`);
step('il nomme aussi les offres publiées (jamais un total brut)', Number.isInteger(stats?.data?.offers),
  `offers=${stats?.data?.offers}`);

// --- 2. le plafond de fenêtre n'est PAS le total ---
const listRes = await fetch(`${baseUrl}/api/v2/public/facilities`, { headers: { Accept: 'application/json' } });
const list = await listRes.json().catch(() => null);
const listLen = Array.isArray(list?.data) ? list.data.length : null;
step('GET /api/v2/public/facilities → 200', listRes.status === 200, `status=${listRes.status}`);
step('la liste est PLAFONNÉE (≠ total) — lire sa longueur mentait', listLen === 2000 && facilities > listLen,
  `liste=${listLen} vs total=${facilities}`);

// --- 3. le bundle client servi porte la vérité, pas l'ancien mensonge ---
const html = await (await fetch(baseUrl)).text();
const entry = html.match(/assets\/(index-[A-Za-z0-9_-]+\.js)/)?.[1];
step('le HTML prod nomme le bundle d’entrée', Boolean(entry), entry ?? '(introuvable)');
if (entry) {
  const js = await (await fetch(`${baseUrl}/assets/${entry}`)).text();
  step('bundle : libellé honnête « Lieux connus » présent', js.includes('Lieux connus'));
  step('bundle : « Lieux sur la carte » (ancien, plafond déguisé) absent', !js.includes('Lieux sur la carte'));
  step('bundle : aucun littéral « 5 offres max »', !js.includes('5 offres max'));
  step('bundle : aucun littéral « 1 comparaison »', !js.includes('1 comparaison'));
}

console.log(failures === 0 ? '\nNUMBER-TRUTH PROOF: ALL PASS' : `\nNUMBER-TRUTH PROOF: ${failures} FAIL`);
