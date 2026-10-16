// P4 (D-TXN-PRICE, option B fondateur 2026-10-16) — le prix remisé est GELÉ à
// l'intention. Ce script prouve, contre une branche JETABLE et avec le CODE LIVRÉ
// (jamais un mock), les deux moitiés qui font le gel :
//
//   1. À l'intention, le snapshot porte l'ORIGINE (list_price_minor, avant remise),
//      la REMISE appliquée (discount_minor) et le prix DÛ (unit_price_minor, après
//      remise) — la remise Omni (S-19) est donc capturée, pas perdue.
//   2. Le snapshot est APPEND-ONLY : changer le prix OU la remise de l'offre APRÈS
//      l'intention ne modifie RIEN à la transaction (une transaction est une version
//      gelée, S-26). C'est ça, « le prix ne bouge plus ».
//
// Run: P4_PROOF_ALLOW_DISPOSABLE_BRANCH=1 P4_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-price-freeze.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.P4_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing P4_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

// --- Fixture réelle : vendeur (compte + entité + lieu + offre) et acheteur ---
const sellerAuth = `p4-seller-${tag}`;
const buyerAuth = `p4-buyer-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready')`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${buyerAuth}, 'buyer_ready')`;
const seller = (await sql`select id from v2_accounts where auth_user_id = ${sellerAuth}`)[0];
const buyer = (await sql`select id from v2_accounts where auth_user_id = ${buyerAuth}`)[0];
const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${seller.id}::uuid, 'organisation', ${`P4 ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${seller.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`p4-${tag}`}, ${`P4 ${tag}`}, 'fixe', 'unconfirmed', 'ouvert') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${seller.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;

// Offre à 1 000 XOF avec 10 % de remise Omni → l'acheteur doit 900.
const price = 1000;
const percent = 10;
const productId = (await sql`
  insert into v2_products (facility_id, entity_id, name, description, unit, currency, price_minor,
    discount_kind, discount_value, quantity_allocated_omni, publication_state, availability_state,
    position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
  values (${facilityId}::uuid, ${entityId}::uuid, ${`P4 ${tag}`}, 'Offre gel prix', 'unit', 'XOF', ${price},
    'percentage', ${percent}, 10, 'published', 'en_stock',
    'fixe', 'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'x' }])}::jsonb)
  returning id`)[0].id;

const request = await repo.createAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityId, quantity: 2, budgetMode: 'maximum', budgetMinor: 2500,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `p4-req-${tag}`, correlationId: `corr-req-${tag}`,
});
await repo.respondAvailability({
  authUserId: sellerAuth, requestId: request.requestId, facilityId, productId, status: 'available',
  quantityAvailable: 2, priceMinor: price, sellerMessage: 'Disponible', idempotencyKey: `p4-resp-${tag}`, correlationId: `corr-resp-${tag}`,
});
const responseId = (await sql`select id from v2_availability_responses where request_id = ${request.requestId}::uuid limit 1`)[0].id;
const intent = await repo.createPurchaseIntent({
  authUserId: buyerAuth, responseId: String(responseId), quantity: 2, idempotencyKey: `p4-intent-${tag}`, correlationId: `corr-intent-${tag}`,
});

// --- T1 : le gel capture l'origine ET la remise ---
const txnId = String(intent.transactionId);
const frozen = (await sql`select list_price_minor, discount_minor, unit_price_minor, net_amount_minor, quantity from v2_transaction_snapshots where transaction_id = ${txnId}::uuid`)[0];
step('T1a origine gelée (list_price_minor = prix affiché)', Number(frozen.list_price_minor) === price, `list=${frozen.list_price_minor}`);
step('T1b remise gelée (discount_minor = 10 % de 1000)', Number(frozen.discount_minor) === Math.floor(price * percent / 100), `discount=${frozen.discount_minor}`);
step('T1c prix dû = origine − remise', Number(frozen.unit_price_minor) === price - Math.floor(price * percent / 100), `unit=${frozen.unit_price_minor}`);
step('T1d total dû = prix dû × quantité (jamais sur le prix plein)', Number(frozen.net_amount_minor) === (price - Math.floor(price * percent / 100)) * 2, `net=${frozen.net_amount_minor}`);

// --- T2 : le vendeur CHANGE le prix et la remise APRÈS l'intention ---
await sql`update v2_products set price_minor = 5000, discount_kind = 'percentage', discount_value = 50 where id = ${productId}::uuid`;

// --- T3 : la transaction relue par le CODE LIVRÉ garde SES chiffres ---
const read = await repo.getTransaction({ authUserId: buyerAuth, transactionId: txnId, correlationId: `corr-read-${tag}` });
step('T3a listPriceMinor inchangé après changement d\'offre', read.listPriceMinor === price, `read=${read.listPriceMinor}`);
step('T3b discountMinor inchangé après changement d\'offre', read.discountMinor === Math.floor(price * percent / 100), `read=${read.discountMinor}`);
step('T3c unitPriceMinor inchangé après changement d\'offre', read.unitPriceMinor === price - Math.floor(price * percent / 100), `read=${read.unitPriceMinor}`);
step('T3d netAmountMinor inchangé après changement d\'offre', read.netAmountMinor === (price - Math.floor(price * percent / 100)) * 2, `read=${read.netAmountMinor}`);

// --- T4 : le snapshot est bien APPEND-ONLY (la contrainte qui rend le gel réel) ---
let appendOnlyEnforced = false;
try {
  await sql`update v2_transaction_snapshots set unit_price_minor = 1 where transaction_id = ${txnId}::uuid`;
} catch {
  appendOnlyEnforced = true;
}
step('T4 le snapshot refuse toute mutation (append-only)', appendOnlyEnforced);

// --- Nettoyage best-effort (branche jetable) ---
try {
  await sql`delete from v2_transaction_snapshots where transaction_id = ${txnId}::uuid`;
  await sql`delete from v2_products where id = ${productId}::uuid`;
  await sql`delete from v2_facility_slots where facility_id = ${facilityId}::uuid`;
  await sql`delete from v2_facilities where id = ${facilityId}::uuid`;
  await sql`delete from v2_entities where id = ${entityId}::uuid`;
  await sql`delete from v2_accounts where auth_user_id in (${sellerAuth}, ${buyerAuth})`;
} catch { /* append-only : le nettoyage peut échouer, la branche est jetable */ }

console.log(failures === 0 ? '\nP4 PRICE FREEZE OK' : `\nP4 PRICE FREEZE FAILED (${failures})`);
