// RH-01 / E-03 / E-04 — publication honesty, proven end-to-end against a DISPOSABLE branch.
//
// The repository test suite stubs `sql`, so it cannot COMPILE the SQL. This script drives the
// real shipped `createTrunkRepository` against a real Postgres, which is the only class that can
// catch a `jsonb_array_length` type error, a CTE visibility mistake, or the AND/OR precedence bug
// in the publication statement.
//
// It already found one real divergence: `facility.account_id` is a SECOND notion of owner, while
// every other seller operation reads coalesce(product.entity_id, facility.entity_id) →
// v2_entities.account_id. With the wrong join, T3 (media attach by the real owner) FAILED.
//
// Fixtures are created through the SHIPPED code and removed at the end, so the run is repeatable.
// NEVER point this at the canonical branch. Create a throwaway branch from it, run, then delete.
//
// Run: RH01_PROOF_ALLOW_DISPOSABLE_BRANCH=1 RH01_PROOF_DATABASE_URL=<throwaway> \
//      npx tsx scripts/prove-rh01-publication.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const url = process.env.RH01_PROOF_DATABASE_URL;
if (process.env.RH01_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('rh01-proof: set RH01_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes rows)');
  process.exit(2);
}
if (!url) { console.error('rh01-proof: missing RH01_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(url);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const sellerAuth = `rh01-seller-${tag}`;

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

let accountId; let facilityId; let productId; let secondProductId;

try {
  // ---- Fixtures: a seller_ready account, its facility/entity and a draft offer, via shipped code.
  accountId = (await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready') returning id`)[0].id;
  const facility = await repository.createSellerFacility({
    authUserId: sellerAuth, name: `RH01 Boutique ${tag}`, facilityType: 'fixe', ownerKind: 'organisation', category: 'Épicerie',
    description: null, address: 'Lomé', latitude: 6.1319, longitude: 1.2223, rayonKm: null,
    contactPhone: null, contactWhatsapp: null, idempotencyKey: `rh01-facility-${tag}`,
  });
  facilityId = facility.facilityId;
  const draft = await repository.createSellerProductDraft({
    authUserId: sellerAuth, facilityId, name: `RH01 Offre ${tag}`, description: null, unit: 'pièce',
    prixOriginal: 5000000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 1,
    idempotencyKey: `rh01-offer-${tag}`,
    positionKind: 'fixe', uniquenessKind: 'piece_unique', handoverKind: 'retrait', priceKind: 'negociable', conditionKind: 'neuf',
  });
  productId = draft.productId;
  step('fixtures: seller_ready account + facility + draft offer created by shipped code', Boolean(accountId && facilityId && productId), `facility=${facilityId} product=${productId}`);

  // T1 — the refusal is pronounced by the real statement and NAMES its reason (no visual yet).
  try {
    await repository.transitionSellerProduct({ authUserId: sellerAuth, productId, to: 'published' });
    step('T1 media refusal', false, 'publication was allowed (expected refusal)');
  } catch (error) {
    step('T1 media refusal', String(error.message) === 'MEDIA_REQUIRED', String(error.message));
  }

  // T2 — the parenthesised branch must not let an archive escape the owned-product filter.
  try {
    await repository.transitionSellerProduct({ authUserId: sellerAuth, productId, to: 'archived' });
    step('T2 archive a draft', false, 'archived a draft (expected refusal)');
  } catch (error) {
    step('T2 archive a draft', true, `refused: ${error.message}`);
  }
  const publishedBefore = (await repository.listSellerCatalogue({ authUserId: sellerAuth })).products.filter((p) => p.publicationState === 'published').length;
  step('T2b no mass archive', publishedBefore === 0, `published after refused archive = ${publishedBefore}`);

  // T3 — media writes to the real jsonb column and reads back through the projection.
  const attached = await repository.setSellerProductMedia({ authUserId: sellerAuth, productId, media: [{ url: 'https://example.public.blob.vercel-storage.com/offers/x/a.jpg', kind: 'image' }] });
  step('T3 media attach', attached.media.length === 1, JSON.stringify(attached.media));
  const reread = await repository.listSellerCatalogue({ authUserId: sellerAuth });
  const row = reread.products.find((p) => p.id === productId);
  step('T3b media read-back', (row?.media?.length ?? 0) === 1, `media=${JSON.stringify(row?.media)}`);

  // T4 — the gate must OPEN, not only close: with the visual present, a complete offer publishes.
  // The advantage is MANDATORY at draft creation (pourcentageReduction 1..90), so a draft created
  // through the shipped code always carries one — `ADVANTAGE_REQUIRED` is a defensive branch, not
  // a state the product can reach through its own API. T5 proves that branch by removing the
  // discount directly, so we know the guard reads the persisted fact and is not a no-op.
  try {
    const published = await repository.transitionSellerProduct({ authUserId: sellerAuth, productId, to: 'published' });
    step('T4 publication succeeds', published.publicationState === 'published', `state=${published.publicationState}`);
  } catch (error) {
    step('T4 publication succeeds', false, `refused: ${error.message}`);
  }

  // T5 — advantage guard, proven on a SECOND offer so the published one stays untouched.
  const second = await repository.createSellerProductDraft({
    authUserId: sellerAuth, facilityId, name: `RH01 Offre 2 ${tag}`, description: null, unit: 'pièce',
    prixOriginal: 4000000, currency: 'XOF', pourcentageReduction: 5, stockLoueOmni: 1,
    idempotencyKey: `rh01-offer2-${tag}`,
    positionKind: 'fixe', uniquenessKind: 'piece_unique', handoverKind: 'retrait', priceKind: 'negociable', conditionKind: 'neuf',
  });
  secondProductId = second.productId;
  await repository.setSellerProductMedia({ authUserId: sellerAuth, productId: secondProductId, media: [{ url: 'https://example.public.blob.vercel-storage.com/offers/x/c.jpg', kind: 'image' }] });
  await sql`update v2_products set discount_kind = null, discount_value_minor = null where id = ${secondProductId}::uuid`;
  try {
    await repository.transitionSellerProduct({ authUserId: sellerAuth, productId: secondProductId, to: 'published' });
    step('T5 advantage refusal', false, 'publication was allowed without an advantage');
  } catch (error) {
    step('T5 advantage refusal', String(error.message) === 'ADVANTAGE_REQUIRED', String(error.message));
  }

  // T6 — restore the advantage: the same offer publishes (the refusal was about the FACT, not a
  // permanent bar). This is the "name the reason, then let the seller fix it" contract.
  await sql`update v2_products set discount_kind = 'percentage', discount_value_minor = 10 where id = ${secondProductId}::uuid`;
  try {
    const republished = await repository.transitionSellerProduct({ authUserId: sellerAuth, productId: secondProductId, to: 'published' });
    step('T6 publishes once the fact is restored', republished.publicationState === 'published', `state=${republished.publicationState}`);
  } catch (error) {
    step('T6 publishes once the fact is restored', false, `refused: ${error.message}`);
  }

  // T7 — archiving touches ONLY the named offer (the precedence fix, positive path).
  const others = (await sql`select count(*)::int as n from v2_products where publication_state = 'published' and id not in (${productId}::uuid, ${secondProductId}::uuid)`)[0].n;
  try {
    await repository.transitionSellerProduct({ authUserId: sellerAuth, productId: secondProductId, to: 'archived' });
  } catch (error) {
    step('T7 archive succeeds', false, `refused: ${error.message}`);
  }
  const othersAfter = (await sql`select count(*)::int as n from v2_products where publication_state = 'published' and id not in (${productId}::uuid, ${secondProductId}::uuid)`)[0].n;
  const mineAfter = (await sql`select publication_state from v2_products where id = ${secondProductId}::uuid`)[0].publication_state;
  const firstStill = (await sql`select publication_state from v2_products where id = ${productId}::uuid`)[0].publication_state;
  step('T7 archives only this offer', mineAfter === 'archived' && othersAfter === others && firstStill === 'published', `archived=${mineAfter} first=${firstStill} others published ${others} -> ${othersAfter}`);

  // T8 — a non-owner cannot attach a visual: ownership is really enforced, not assumed.
  const stranger = `rh01-stranger-${tag}`;
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${stranger}, 'seller_ready')`;
  try {
    await repository.setSellerProductMedia({ authUserId: stranger, productId, media: [{ url: 'https://example.public.blob.vercel-storage.com/offers/x/b.jpg', kind: 'image' }] });
    step('T8 non-owner refused', false, 'a stranger attached a visual');
  } catch (error) {
    step('T8 non-owner refused', String(error.message) === 'FORBIDDEN_OR_NOT_EDITABLE', String(error.message));
  }
  step('T8b canManageSellerProduct false for stranger', (await repository.canManageSellerProduct({ authUserId: stranger, productId })) === false);
  step('T8c canManageSellerProduct true for owner', (await repository.canManageSellerProduct({ authUserId: sellerAuth, productId })) === true);
} finally {
  // Best-effort cleanup so the run is repeatable on a reused branch. Order matters: entities and
  // facilities are ON DELETE RESTRICT, so they must go before their account.
  const auths = [sellerAuth, `rh01-stranger-${tag}`];
  if (secondProductId) await sql`delete from v2_products where id = ${secondProductId}::uuid`.catch(() => {});
  if (productId) await sql`delete from v2_products where id = ${productId}::uuid`.catch(() => {});
  if (facilityId) await sql`delete from v2_facilities where id = ${facilityId}::uuid`.catch(() => {});
  await sql`delete from v2_entities where account_id in (select id from v2_accounts where auth_user_id = any(${auths}))`.catch(() => {});
  await sql`delete from v2_accounts where auth_user_id = any(${auths})`.catch(() => {});
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
