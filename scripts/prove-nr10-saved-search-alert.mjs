// NR-10 — prove the saved-search ALERT producer against a DISPOSABLE branch, using the shipped
// code (never a mock). The promise of the « Recherches enregistrées » sheet (« être alerté »)
// had NO producer before this slice: nothing ever wrote an event, so no buyer could be alerted
// of anything. This drives the real `transitionSellerProduct` (the honest moment: first
// publication) and asserts the event lands, targets the SEARCH, and never double-fires.
//
// Run: NR10_PROOF_ALLOW_DISPOSABLE_BRANCH=1 NR10_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-nr10-saved-search-alert.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.NR10_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing NR10_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

async function makeSeller(label) {
  const auth = `nr10-seller-${label}-${tag}`;
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${auth}, 'seller_ready')`;
  const account = (await sql`select id from v2_accounts where auth_user_id = ${auth}`)[0];
  const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${account.id}::uuid, 'organisation', ${`NR10 ${label} ${tag}`}, 'unconfirmed') returning id`)[0].id;
  const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${account.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`nr10-${label}-${tag}`}, ${`NR10 ${label} ${tag}`}, 'fixe', 'unconfirmed', 'ouvert') returning id`)[0].id;
  await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${account.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
  return { auth, accountId: String(account.id), entityId: String(entityId), facilityId: String(facilityId) };
}

async function makeBuyer(label) {
  const auth = `nr10-buyer-${label}-${tag}`;
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${auth}, 'buyer_ready')`;
  const account = (await sql`select id from v2_accounts where auth_user_id = ${auth}`)[0];
  return { auth, accountId: String(account.id) };
}

// A DRAFT offer (never published yet): the transition to `published` is the honest alert moment.
async function makeDraftOffer(seller, name) {
  const id = (await sql`
    insert into v2_products (facility_id, entity_id, name, description, unit, currency, price_minor,
      discount_kind, discount_value, quantity_allocated_omni, publication_state, availability_state,
      position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
    values (${seller.facilityId}::uuid, ${seller.entityId}::uuid, ${name}, 'Offre de preuve NR-10', 'unit', 'XOF', 1000,
      'percentage', 5, 10, 'draft', 'a_valider',
      'fixe', 'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'x' }])}::jsonb)
    returning id`)[0].id;
  return String(id);
}

const alertsFor = (accountId) => sql`
  select event_type, entity_type, entity_id, payload, dedupe_key
  from v2_notification_events where recipient_account_id = ${accountId}::uuid and event_type = 'saved_search_match'`;

try {
  const seller = await makeSeller('s');
  const buyerMatch = await makeBuyer('m');   // saved search that MATCHES
  const buyerNoMatch = await makeBuyer('n'); // saved search that does NOT match
  const buyerInactive = await makeBuyer('i'); // saved search, but inactive

  await sql`insert into v2_saved_searches (account_id, query, constraints, active) values (${buyerMatch.accountId}::uuid, 'riz parfumé', '{}'::jsonb, true)`;
  await sql`insert into v2_saved_searches (account_id, query, constraints, active) values (${buyerNoMatch.accountId}::uuid, 'ordinateur portable', '{}'::jsonb, true)`;
  await sql`insert into v2_saved_searches (account_id, query, constraints, active) values (${buyerInactive.accountId}::uuid, 'riz', '{}'::jsonb, false)`;

  const productId = await makeDraftOffer(seller, `Riz parfumé ${tag} de Lomé`);

  // T1 — publish: the matching buyer is alerted.
  await repo.transitionSellerProduct({ authUserId: seller.auth, productId, to: 'published', correlationId: `nr10-${tag}` });
  const matchAlerts = await alertsFor(buyerMatch.accountId);
  step('T1 une publication alerte la recherche qui correspond', matchAlerts.length === 1, `events=${matchAlerts.length}`);
  step('T2 la cible est la RECHERCHE (entity_id = la requête, pas un id opaque)',
    matchAlerts[0]?.entity_type === 'saved_search' && matchAlerts[0]?.entity_id === 'riz parfumé',
    `entity_type=${matchAlerts[0]?.entity_type} entity_id=${matchAlerts[0]?.entity_id}`);

  // T3 — the non-matching search is NOT alerted.
  step('T3 une recherche qui ne correspond pas ne reçoit rien', (await alertsFor(buyerNoMatch.accountId)).length === 0);
  // T4 — an inactive search is NOT alerted.
  step('T4 une recherche désactivée ne reçoit rien', (await alertsFor(buyerInactive.accountId)).length === 0);

  // T5 — the alert is delivered in_app (a queued delivery row exists).
  const inApp = await sql`
    select d.state from v2_notification_deliveries d
    join v2_notification_events e on e.id = d.event_id
    where e.recipient_account_id = ${buyerMatch.accountId}::uuid and e.event_type = 'saved_search_match' and d.channel = 'in_app'`;
  step('T5 l’alerte est livrée in_app (file)', inApp.length === 1 && inApp[0].state === 'queued', `rows=${inApp.length}`);

  // T6 — REPLAY: the same publication retried must not double-alert. The transition is guarded
  // by `changed` (published only from draft) AND by the dedupe key, so a retry finds nothing to
  // change and adds no second alert.
  let replayed = false;
  try {
    await repo.transitionSellerProduct({ authUserId: seller.auth, productId, to: 'published', correlationId: `nr10-${tag}-r` });
  } catch { replayed = true; }
  step('T6 le rejeu d’une publication ne re-notifie pas', replayed && (await alertsFor(buyerMatch.accountId)).length === 1,
    `threw=${replayed} events=${(await alertsFor(buyerMatch.accountId)).length}`);

  // T7 — a search with no exploitable token produces no alert at all.
  const buyerJunk = await makeBuyer('j');
  await sql`insert into v2_saved_searches (account_id, query, constraints, active) values (${buyerJunk.accountId}::uuid, '!!!', '{}'::jsonb, true)`;
  const second = await makeDraftOffer(seller, `Riz parfumé ${tag} premium`);
  await repo.transitionSellerProduct({ authUserId: seller.auth, productId: second, to: 'published', correlationId: `nr10-${tag}-2` });
  step('T7 une requête sans jeton ne produit aucune alerte', (await alertsFor(buyerJunk.accountId)).length === 0);
  // and the matching buyer IS alerted for the second offer (per-product dedupe, not per-search)
  step('T8 une seconde offre alerte de nouveau la même recherche', (await alertsFor(buyerMatch.accountId)).length === 2,
    `events=${(await alertsFor(buyerMatch.accountId)).length}`);
} finally {
  // Best-effort cleanup (the branch is disposable anyway).
  await sql`delete from v2_notification_deliveries where event_id in (select id from v2_notification_events where correlation_id like ${`nr10-${tag}%`})`.catch(() => {});
  await sql`delete from v2_notification_events where correlation_id like ${`nr10-${tag}%`}`.catch(() => {});
  await sql`delete from v2_saved_searches where account_id in (select id from v2_accounts where auth_user_id like ${`nr10-%${tag}`})`.catch(() => {});
  await sql`delete from v2_products where entity_id in (select id from v2_entities where display_name like ${`NR10 %${tag}`})`.catch(() => {});
  await sql`delete from v2_facility_slots where account_id in (select id from v2_accounts where auth_user_id like ${`nr10-%${tag}`})`.catch(() => {});
  await sql`delete from v2_facilities where source_ref like ${`nr10-%${tag}`}`.catch(() => {});
  await sql`delete from v2_entities where display_name like ${`NR10 %${tag}`}`.catch(() => {});
  await sql`delete from v2_accounts where auth_user_id like ${`nr10-%${tag}`}`.catch(() => {});
  console.log(failures === 0 ? 'NR-10 PROOF: all steps PASS' : `NR-10 PROOF: ${failures} FAILURE(S)`);
}
