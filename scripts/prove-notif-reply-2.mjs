// BRANCHES-NOTIF-REPLY-2 — prouve, sur une branche JETABLE et avec le code LIVRÉ, que le
// vendeur peut RÉPONDRE, et que la garde de stock NOMME son vrai motif au lieu d'accuser
// le vendeur d'autorisation.
//
// Défauts mesurés (canonique) : une demande de 3 « Riz au soja » face à un stock réel de 1.
//   (A) le formulaire partait VIDE → le serveur refusait tout (« requires a positive quantity »).
//   (B) un dépassement de STOCK levait « The seller is not authorized… » (le CTE `eligible`
//       mêle autorisation ET garde de stock) → un vendeur légitime accusé d'autorisation.
//
// Run: REPLY2_PROOF_ALLOW_DISPOSABLE_BRANCH=1 REPLY2_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-notif-reply-2.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.REPLY2_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing REPLY2_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

// --- Fixture : entité + facilité + offre (stock alloué 1) + acheteur + demande de 3 ---
const sellerAuth = `reply2-seller-${tag}`;
const buyerAuth = `reply2-buyer-${tag}`;
const ids = {};

const sellerAccount = await sql`
  insert into v2_accounts (auth_user_id, onboarding_state)
  values (${sellerAuth}, 'seller_ready')
  returning id
`;
ids.sellerAccount = sellerAccount[0].id;

const entity = await sql`
  insert into v2_entities (account_id, display_name, kind, trust_state)
  values (${ids.sellerAccount}, ${`Reply2 Entity ${tag}`}, 'organisation', 'confirmed')
  returning id
`;
ids.entity = entity[0].id;

const facility = await sql`
  insert into v2_facilities (account_id, entity_id, name, category, latitude, longitude, trust_state)
  values (${ids.sellerAccount}, ${ids.entity}, ${`Reply2 Facility ${tag}`}, 'Épicerie', 6.13, 1.22, 'confirmed')
  returning id
`;
ids.facility = facility[0].id;

const product = await sql`
  insert into v2_products
    (facility_id, entity_id, name, publication_state, price_minor, currency, quantity_allocated_omni,
     uniqueness_kind, handover_kind, price_kind, condition_kind, media)
  values (${ids.facility}, ${ids.entity}, ${`Riz ${tag}`}, 'published', 100000, 'XOF', 1,
     'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify(['/demo/box-dejeuner.png'])}::jsonb)
  returning id
`;
ids.product = product[0].id;

const buyerAccount = await sql`
  insert into v2_accounts (auth_user_id, onboarding_state)
  values (${buyerAuth}, 'buyer_ready')
  returning id
`;
ids.buyerAccount = buyerAccount[0].id;

const request = await sql`
  insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at)
  values (${ids.buyerAccount}, ${ids.product}, array[${ids.facility}]::uuid[], 3, 'unlimited', 'submitted',
     ${`reply2-req-${tag}`}, now() + interval '1 hour')
  returning id
`;
ids.request = request[0].id;

// --- T1 : la file vendeur expose le STOCK RÉEL et le prix affiché ---
try {
  const queue = await repo.getSellerAvailabilityQueue({ authUserId: sellerAuth });
  const row = queue.requests.find((r) => r.id === ids.request);
  step('T1 file vendeur expose availableStock', row?.availableStock === 1, `availableStock=${row?.availableStock}`);
  step('T1b file vendeur expose listedPriceMinor', row?.listedPriceMinor === 100000, `listedPriceMinor=${row?.listedPriceMinor}`);
} catch (e) {
  step('T1 file vendeur expose availableStock', false, e.message);
}

// --- T2 : dépasser le stock nomme le VRAI motif (stock), jamais « not authorized » ---
try {
  await repo.respondAvailability({
    authUserId: sellerAuth, requestId: ids.request, facilityId: ids.facility, productId: ids.product,
    status: 'available', quantityAvailable: 3, priceMinor: 100000, sellerMessage: null,
    idempotencyKey: `reply2-over-${tag}`, correlationId: `corr-${tag}`,
  });
  step('T2 dépassement de stock refusé', false, 'aucune erreur levée');
} catch (e) {
  step('T2 dépassement de stock nommé', /exceeds the available stock \(1\)/.test(e.message), e.message);
  step('T2b message trompeur d’autorisation absent', !/not authorized/.test(e.message), e.message);
}

// --- T3 : une réponse DANS le stock réussit ---
try {
  const res = await repo.respondAvailability({
    authUserId: sellerAuth, requestId: ids.request, facilityId: ids.facility, productId: ids.product,
    status: 'partial', quantityAvailable: 1, priceMinor: 100000, sellerMessage: null,
    idempotencyKey: `reply2-ok-${tag}`, correlationId: `corr-${tag}`,
  });
  step('T3 réponse dans le stock persistée', res.quantityAvailable === 1, `qty=${res.quantityAvailable}`);
} catch (e) {
  step('T3 réponse dans le stock persistée', false, e.message);
}

// --- T4 : un vendeur NON autorisé garde le message d'autorisation ---
try {
  await repo.respondAvailability({
    authUserId: `reply2-stranger-${tag}`, requestId: ids.request, facilityId: ids.facility, productId: ids.product,
    status: 'available', quantityAvailable: 1, priceMinor: 100000, sellerMessage: null,
    idempotencyKey: `reply2-stranger-${tag}`, correlationId: `corr-${tag}`,
  });
  step('T4 étranger refusé', false, 'aucune erreur levée');
} catch (e) {
  step('T4 étranger garde le motif d’autorisation', /not authorized/.test(e.message), e.message);
}

// --- Cleanup best-effort (branche jetable) ---
await sql`delete from v2_availability_responses where request_id = ${ids.request}`;
await sql`delete from v2_audit_events where correlation_id = ${`corr-${tag}`}`;
await sql`delete from v2_notification_events where correlation_id = ${`corr-${tag}`}`;
await sql`delete from v2_availability_requests where id = ${ids.request}`;
await sql`delete from v2_products where id = ${ids.product}`;
await sql`delete from v2_facilities where id = ${ids.facility}`;
await sql`delete from v2_entities where id = ${ids.entity}`;
await sql`delete from v2_accounts where id in (${ids.sellerAccount}, ${ids.buyerAccount})`;

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAIL`);
