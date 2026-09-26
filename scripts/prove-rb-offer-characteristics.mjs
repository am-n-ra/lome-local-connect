// R-B (S-01) offer characteristics — end-to-end proof against a DISPOSABLE database branch.
//
// Drives the real shipped repository code (createTrunkRepository) against a real Postgres
// branch, with real fixtures, to prove that an offer's characteristics are:
//   declared at creation → persisted in the DB → read back by the SELLER catalogue
//   → read back by the BUYER offer sheet (facility detail) → and that an invalid
//   characteristic is refused instead of silently written.
//
// Before R-B, the five `*_kind` columns existed in the schema but were never written:
// an offer was born with no characteristic at all, which emptied S-01 ("tout est offre").
//
// NEVER point this at the canonical branch: it writes and deletes rows. Run it on a
// throwaway branch created from the canonical one, then delete the branch.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.RB_PROOF_DATABASE_URL;
if (process.env.RB_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('rb-proof: set RB_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('rb-proof: missing RB_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}
function abort(reason) { console.error(`rb-proof: ABORT ${reason}`); process.exit(1); }

console.log(`rb-proof correlationId=${correlationId} tag=${tag}`);

const sellerAuth = `rb-seller-${tag}`;
let sellerAccountId; let facilityId; let productId;

try {
  // ---- Fixtures: one seller account (seller_ready), one facility + entity via the shipped code.
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id, onboarding_state)
    values (${sellerAuth}, 'seller_ready') returning id`)[0].id;

  const facility = await repository.createSellerFacility({
    authUserId: sellerAuth, name: `RB Boutique ${tag}`, facilityType: 'fixe', category: 'Épicerie',
    description: null, address: 'Lomé', latitude: 6.1319, longitude: 1.2223, rayonKm: null,
    contactPhone: null, contactWhatsapp: null, idempotencyKey: `rb-facility-${tag}`,
  });
  facilityId = facility.facilityId;
  step('fixtures: seller_ready account + facility (+entity) created by the shipped code', Boolean(sellerAccountId && facilityId), `facility=${facilityId}`);

  // ---- T1: declare the five characteristics at creation; the draft is accepted.
  const draft = await repository.createSellerProductDraft({
    authUserId: sellerAuth, facilityId, name: `Ordinateur Dell ${tag}`, description: null, unit: 'pièce',
    prixOriginal: 5000000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 1,
    idempotencyKey: `rb-offer-${tag}`,
    positionKind: 'fixe', uniquenessKind: 'piece_unique', handoverKind: 'retrait', priceKind: 'negociable', conditionKind: 'occasion',
  });
  productId = draft.productId;
  step('T1 offer created with declared characteristics', Boolean(productId) && draft.publicationState === 'draft', `product=${productId}`);

  // ---- T2: the characteristics are really in the DB (not just accepted by the input validator).
  const persisted = (await sql`select position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind
    from v2_products where id = ${productId}::uuid`)[0];
  step('T2 characteristics persisted in the database',
    persisted.position_kind === 'fixe' && persisted.uniqueness_kind === 'piece_unique'
    && persisted.handover_kind === 'retrait' && persisted.price_kind === 'negociable' && persisted.condition_kind === 'occasion',
    `position=${persisted.position_kind} unique=${persisted.uniqueness_kind} handover=${persisted.handover_kind} price=${persisted.price_kind} condition=${persisted.condition_kind}`);

  // ---- T3: the SELLER catalogue reads them back.
  const catalogue = await repository.listSellerCatalogue({ authUserId: sellerAuth });
  const listed = catalogue.products.find((p) => p.id === productId);
  step('T3 seller catalogue reads the characteristics back',
    listed?.positionKind === 'fixe' && listed?.uniquenessKind === 'piece_unique' && listed?.handoverKind === 'retrait'
    && listed?.priceKind === 'negociable' && listed?.conditionKind === 'occasion',
    `position=${listed?.positionKind} unique=${listed?.uniquenessKind} handover=${listed?.handoverKind} price=${listed?.priceKind} condition=${listed?.conditionKind}`);

  // ---- T4: publish, then the BUYER offer sheet (facility detail) reads them back too.
  await sql`update v2_products set publication_state = 'published' where id = ${productId}::uuid`;
  await sql`update v2_entities set trust_state = 'confirmed' where id = (select entity_id from v2_products where id = ${productId}::uuid)`;
  const detail = await repository.getFacilityDetail(facilityId);
  const offered = detail?.products?.find((p) => p.id === productId);
  step('T4 buyer offer sheet reads the characteristics back',
    offered?.positionKind === 'fixe' && offered?.uniquenessKind === 'piece_unique' && offered?.handoverKind === 'retrait'
    && offered?.priceKind === 'negociable' && offered?.conditionKind === 'occasion',
    `position=${offered?.positionKind} unique=${offered?.uniquenessKind} handover=${offered?.handoverKind} price=${offered?.priceKind} condition=${offered?.conditionKind}`);

  // ---- T5: an invalid characteristic is refused, not written.
  let refused = false; let refuseDetail = '';
  try {
    await repository.createSellerProductDraft({
      authUserId: sellerAuth, facilityId, name: `Invalid ${tag}`, description: null, unit: 'pièce',
      prixOriginal: 100000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 1,
      idempotencyKey: `rb-offer-bad-${tag}`, positionKind: 'teleportation',
    });
  } catch (error) { refused = true; refuseDetail = String(error?.name ?? error).slice(0, 60); }
  const leaked = (await sql`select count(*)::int as n from v2_products where name = ${`Invalid ${tag}`}`)[0].n;
  step('T5 invalid characteristic refused and no row written', refused && leaked === 0, `refused=${refused} rows=${leaked} msg=${refuseDetail}`);

  // ---- T6: an offer may legitimately declare nothing (columns are nullable by design).
  const bare = await repository.createSellerProductDraft({
    authUserId: sellerAuth, facilityId, name: `Bare ${tag}`, description: null, unit: 'pièce',
    prixOriginal: 100000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 1,
    idempotencyKey: `rb-offer-bare-${tag}`,
  });
  const bareRow = (await sql`select position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind
    from v2_products where id = ${bare.productId}::uuid`)[0];
  step('T6 offer with no declared characteristic is accepted and stays null',
    Boolean(bare.productId) && bareRow.position_kind === null && bareRow.uniqueness_kind === null && bareRow.handover_kind === null && bareRow.price_kind === null && bareRow.condition_kind === null,
    `position=${bareRow.position_kind} condition=${bareRow.condition_kind}`);
} catch (error) {
  abort(`unexpected error: ${String(error?.message ?? error)}`);
} finally {
  // Best-effort cleanup: the branch is disposable, but leave no trace anyway.
  try {
    if (productId) await sql`delete from v2_products where id = ${productId}::uuid`;
    if (facilityId) {
      await sql`delete from v2_products where facility_id = ${facilityId}::uuid`;
      await sql`delete from v2_facility_slots where facility_id = ${facilityId}::uuid`;
      await sql`delete from v2_facilities where id = ${facilityId}::uuid`;
    }
    if (sellerAccountId) {
      await sql`delete from v2_entities where account_id = ${sellerAccountId}::uuid`;
      await sql`delete from v2_facility_slots where account_id = ${sellerAccountId}::uuid`;
      await sql`delete from v2_accounts where id = ${sellerAccountId}::uuid`;
    }
    console.log('rb-proof cleanup done');
  } catch (error) {
    console.log(`rb-proof cleanup best-effort: ${String(error?.message ?? error)}`);
  }
  console.log(failures === 0 ? 'rb-proof RESULT: PASS' : `rb-proof RESULT: FAIL (${failures})`);
}
