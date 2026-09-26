// RH-02 « on exige » — a silent offer cannot be published. Proven against a DISPOSABLE branch.
//
// Why a real-SQL proof and not a unit test: the repository suite stubs `sql`, so it never COMPILES
// a statement. Adding four columns to the `publication_block` CASE while forgetting to select them
// in the `owned` CTE is a mistake Postgres rejects and a stub cannot see. This script drives the
// real shipped `createTrunkRepository` against a real Postgres.
//
// It proves the gate in BOTH directions: it must CLOSE on a silent offer (naming the exact missing
// fact) and OPEN on a described one. A gate that only closes would brick the catalogue.
//
// Fixtures are created through the SHIPPED code and removed at the end, so the run is repeatable.
// NEVER point this at the canonical branch. Create a throwaway branch from it, run, then delete.
//
// Run: RH02_PROOF_ALLOW_DISPOSABLE_BRANCH=1 RH02_PROOF_DATABASE_URL=<throwaway> \
//      npx tsx scripts/prove-rh02-described-offer.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const url = process.env.RH02_PROOF_DATABASE_URL;
if (process.env.RH02_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('rh02-proof: set RH02_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes rows)');
  process.exit(2);
}
if (!url) { console.error('rh02-proof: missing RH02_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(url);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const sellerAuth = `rh02-seller-${tag}`;
const strangerAuth = `rh02-stranger-${tag}`;

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

let accountId; let facilityId; let createdProductIds = [];

/** A draft carrying all five characteristics, with a visual attached, ready to publish. */
async function describedDraft(label) {
  const draft = await repository.createSellerProductDraft({
    authUserId: sellerAuth, facilityId, name: `RH02 ${label} ${tag}`, description: null, unit: 'pièce',
    prixOriginal: 5000000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 1,
    idempotencyKey: `rh02-${label}-${tag}`,
    positionKind: 'fixe', uniquenessKind: 'piece_unique', handoverKind: 'retrait', priceKind: 'negociable', conditionKind: 'neuf',
  });
  createdProductIds.push(draft.productId);
  await repository.setSellerProductMedia({
    authUserId: sellerAuth, productId: draft.productId,
    media: [{ url: 'https://example.public.blob.vercel-storage.com/offers/x/a.jpg', kind: 'image' }],
  });
  return draft.productId;
}

/** Attempt a publication ONCE and return the refusal code, or 'PUBLISHED' when it succeeded. */
async function attemptPublish(productId) {
  try {
    await repository.transitionSellerProduct({ authUserId: sellerAuth, productId, to: 'published' });
    return 'PUBLISHED';
  } catch (error) {
    return String(error.message);
  }
}

/**
 * Null out ONE characteristic on a fresh described draft, then try to publish it.
 * Column names are literals from a fixed map — never interpolated from data — so each statement
 * is a plain tagged template the driver accepts.
 */
const NULLIFY = {
  uniqueness_kind: (id) => sql`update v2_products set uniqueness_kind = null where id = ${id}::uuid`,
  handover_kind: (id) => sql`update v2_products set handover_kind = null where id = ${id}::uuid`,
  price_kind: (id) => sql`update v2_products set price_kind = null where id = ${id}::uuid`,
  condition_kind: (id) => sql`update v2_products set condition_kind = null where id = ${id}::uuid`,
};

async function refusalForColumn(label, column) {
  const productId = await describedDraft(label);
  await NULLIFY[column](productId);
  return { productId, code: await attemptPublish(productId) };
}

try {
  // ---- Fixtures via shipped code: a seller_ready account, its facility/entity, a described draft.
  accountId = (await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready') returning id`)[0].id;
  const facility = await repository.createSellerFacility({
    authUserId: sellerAuth, name: `RH02 Boutique ${tag}`, facilityType: 'fixe', ownerKind: 'organisation', category: 'Épicerie',
    description: null, address: 'Lomé', latitude: 6.1319, longitude: 1.2223, rayonKm: null,
    contactPhone: null, contactWhatsapp: null, idempotencyKey: `rh02-facility-${tag}`,
  });
  facilityId = facility.facilityId;
  const completeId = await describedDraft('complete');
  step('fixtures: seller_ready account + facility + described draft, by shipped code', Boolean(accountId && facilityId && completeId), `facility=${facilityId} product=${completeId}`);

  // T1 — THE GATE OPENS. A described offer with a visual and an advantage must publish, otherwise
  // the refusal would be a permanent bar and the catalogue would be unpublishable.
  const t1 = await attemptPublish(completeId);
  step('T1 a described offer publishes', t1 === 'PUBLISHED', t1);

  // T2..T5 — THE GATE CLOSES on each of the four characteristics, naming the exact missing fact.
  const cases = [
    ['T2 uniqueness', 'uniqueness_kind', 'UNIQUENESS_REQUIRED'],
    ['T3 handover', 'handover_kind', 'HANDOVER_REQUIRED'],
    ['T4 price kind', 'price_kind', 'PRICE_KIND_REQUIRED'],
    ['T5 condition', 'condition_kind', 'CONDITION_REQUIRED'],
  ];
  for (const [name, column, expected] of cases) {
    const { code } = await refusalForColumn(name.split(' ')[1], column);
    step(`${name} refusal`, code === expected, `expected ${expected}, got ${code}`);
  }

  // T6 — the refusal is about the FACT, not a permanent bar: restoring it publishes the same offer.
  // This is the "name the reason, then let the seller fix it" contract that RH-01 established.
  const fixable = await refusalForColumn('fixable', 'condition_kind');
  step('T6 refuses while silent', fixable.code === 'CONDITION_REQUIRED', fixable.code);
  await sql`update v2_products set condition_kind = 'occasion' where id = ${fixable.productId}::uuid`;
  const t6b = await attemptPublish(fixable.productId);
  step('T6b publishes once the fact is restored', t6b === 'PUBLISHED', t6b);

  // T7 — D-RH-7: an ALREADY PUBLISHED offer is never retro-degraded by this rule. The 13 live
  // offers are silent; the rule must not silently unpublish them (that would be a server act on
  // the pilot catalogue, not a seller act).
  const liveSilent = await describedDraft('silent-published');
  await attemptPublish(liveSilent);
  await sql`update v2_products set uniqueness_kind = null, handover_kind = null, price_kind = null, condition_kind = null where id = ${liveSilent}::uuid`;
  const afterSilencing = (await sql`select publication_state from v2_products where id = ${liveSilent}::uuid`)[0].publication_state;
  step('T7 a published offer is not retro-degraded', afterSilencing === 'published', `state=${afterSilencing}`);
  // ...and it can still be archived, so the rule does not trap it.
  try {
    await repository.transitionSellerProduct({ authUserId: sellerAuth, productId: liveSilent, to: 'archived' });
    step('T7b a silent published offer can still be archived', true);
  } catch (error) {
    step('T7b a silent published offer can still be archived', false, String(error.message));
  }

  // T8 — a non-owner cannot publish, and the refusal is the ownership one, not a characteristic one.
  // Order matters: an unauthorized caller must not learn which fact is missing on someone's offer.
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${strangerAuth}, 'seller_ready')`;
  const strangerTarget = await describedDraft('stranger-target');
  try {
    await repository.transitionSellerProduct({ authUserId: strangerAuth, productId: strangerTarget, to: 'published' });
    step('T8 non-owner refused', false, 'a stranger published an offer');
  } catch (error) {
    step('T8 non-owner refused', String(error.message) === 'FORBIDDEN_OR_LIMIT_REACHED', String(error.message));
  }
} finally {
  // Best-effort cleanup so the run is repeatable. Entities/facilities are ON DELETE RESTRICT, so
  // they must go before their account.
  const auths = [sellerAuth, strangerAuth];
  for (const id of createdProductIds) await sql`delete from v2_products where id = ${id}::uuid`.catch(() => {});
  if (facilityId) await sql`delete from v2_facilities where id = ${facilityId}::uuid`.catch(() => {});
  await sql`delete from v2_entities where account_id in (select id from v2_accounts where auth_user_id = any(${auths}))`.catch(() => {});
  await sql`delete from v2_accounts where auth_user_id = any(${auths})`.catch(() => {});
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
