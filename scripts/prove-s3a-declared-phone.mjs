import { createTrunkRepository } from '../src/server/trunk-repository';
import { neon } from '@neondatabase/serverless';

// S3-a — preuve du code LIVRÉ contre Postgres réel (S-16, numéro déclaré).
// ⚠️ À exécuter sur une branche JETABLE créée depuis la canonique, jamais sur la
// canonique : le script provisionne puis supprime des comptes de test.
//   S3A_PROOF_DATABASE_URL=<branche jetable> npx tsx scripts/prove-s3a-declared-phone.mjs
const url = process.env.S3A_PROOF_DATABASE_URL;
if (!url) throw new Error('S3A_PROOF_DATABASE_URL is required');
const sql = neon(url);
const repo = createTrunkRepository(sql);

const AUTH = 's3a-proof-user';
let failures = 0;
const step = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
  if (!ok) failures += 1;
};

try {
  // T1 — un numéro local est normalisé et enregistré
  const set1 = await repo.setDeclaredPhone({ authUserId: AUTH, phone: '90 12 34 56' });
  step('T1 declare local -> +228', set1?.phoneDeclared === '+22890123456', JSON.stringify(set1));

  // T2 — la lecture du contexte expose la déclaration
  const ctx = await repo.getAccountContext({ authUserId: AUTH });
  step('T2 read exposes phoneDeclared', ctx?.phoneDeclared === '+22890123456', JSON.stringify(ctx?.phoneDeclared));

  // T3 — un numéro invalide est REJETÉ et n'écrase PAS la valeur existante
  let rejected = false;
  try { await repo.setDeclaredPhone({ authUserId: AUTH, phone: '12345' }); } catch { rejected = true; }
  const afterBad = await repo.getAccountContext({ authUserId: AUTH });
  step('T3 invalid rejected, value intact', rejected && afterBad?.phoneDeclared === '+22890123456', JSON.stringify(afterBad?.phoneDeclared));

  // T4 — la contrainte SQL est une garde en profondeur (UPDATE direct d'un mauvais format échoue)
  let dbRejected = false;
  try { await sql`update v2_accounts set phone_declared = '12345' where auth_user_id = ${AUTH}`; } catch { dbRejected = true; }
  step('T4 DB CHECK rejects bad format', dbRejected);

  // T5 — null efface la déclaration
  const erased = await repo.setDeclaredPhone({ authUserId: AUTH, phone: null });
  step('T5 null erases', erased?.phoneDeclared === null, JSON.stringify(erased));

  // T6 — un compte inconnu est provisionné à la volée (pas d'impasse)
  const set2 = await repo.setDeclaredPhone({ authUserId: 's3a-fresh-account', phone: '+22899887766' });
  step('T6 fresh account provisioned', set2?.phoneDeclared === '+22899887766');
} finally {
  await sql`delete from v2_accounts where auth_user_id in (${AUTH}, 's3a-fresh-account')`;
  const residue = await sql`select count(*)::int as n from v2_accounts where auth_user_id like 's3a-%'`;
  console.log('residue', residue[0].n);
  console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
