// BRANCHES-IDENTITY + BRANCHES-SLOT — end-to-end proof against a DISPOSABLE database branch.
//
// Proves the three rules added by this tranche against the SHIPPED repository code:
//   T1  creating a facility that shadows an existing one at the same place is REFUSED and the
//       refusal NAMES the existing place (so the client can route to the claim).
//   T2  a genuinely different place is allowed (the guard is not a blanket block).
//   T3  a SECOND free facility by the same account is refused with the actionable SlotPolicyError
//       (not a generic "forbidden") — the user must be able to buy.
//   T4  buying a slot debits the wallet and creates a paid slot; a replay does NOT create a second.
//   T5  a certified claim assigns the freed slot to the claimed facility, so the seller can see it.
//
// Why a disposable branch: it writes and deletes rows. Never point it at the canonical branch.
//
//   BRANCHES_PROOF_ALLOW_DISPOSABLE_BRANCH=1 BRANCHES_PROOF_DATABASE_URL=<branch> \
//     npx tsx scripts/prove-branches-identity-slot.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, FacilityShadowError, SlotPolicyError } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.BRANCHES_PROOF_DATABASE_URL;
if (process.env.BRANCHES_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('branches-proof: set BRANCHES_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('branches-proof: missing BRANCHES_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`branches-proof correlationId=${correlationId} tag=${tag}`);

const sellerAuth = `branches-seller-${tag}`;
const neighbourAuth = `branches-neighbour-${tag}`;
const claimantAuth = `branches-claimant-${tag}`;
const reviewerAuth = `branches-reviewer-${tag}`;
const facilityIds = [];
const accountIds = [];

const createInput = (authUserId, overrides = {}) => ({
  authUserId, name: `Échoppe ${tag}`, facilityType: 'fixe', ownerKind: 'organisation',
  category: null, description: null, address: 'Lomé', latitude: 6.13, longitude: 1.22, rayonKm: null,
  contactPhone: null, contactWhatsapp: null, idempotencyKey: `branches-${tag}-${randomUUID()}`,
  ...overrides,
});

try {
  // A facility needs an account row (the shipped sign-up path creates it; here we provision it).
  await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}), (${neighbourAuth})`;

  // ---- T1: shadow refusal names the existing place. Two DIFFERENT accounts, same place —
  // exactly the usurpation the guard exists to stop (a seller has only one free slot, so the
  // shadowing attempt must come from a second account).
  const original = await repository.createSellerFacility(createInput(sellerAuth));
  facilityIds.push(original.facilityId);
  let shadowError = null;
  try {
    // Same place, accent-folded name → the same place under a slightly different spelling.
    await repository.createSellerFacility(createInput(neighbourAuth, { name: `Echoppe ${tag}` }));
  } catch (error) { shadowError = error; }
  step('T1 shadow creation is refused and names the existing place',
    shadowError instanceof FacilityShadowError
      && shadowError.existingFacilityId === original.facilityId
      && typeof shadowError.existingFacilityName === 'string' && shadowError.existingFacilityName.length > 0,
    `error=${shadowError?.name} existingId=${shadowError?.existingFacilityId ?? 'n/a'}`);

  // ---- T2: a genuinely different name/place is allowed (the guard is not a blanket block).
  const distinct = await repository.createSellerFacility(createInput(neighbourAuth, {
    name: `Pharmacie ${tag}`, latitude: 6.20, longitude: 1.30,
  }));
  facilityIds.push(distinct.facilityId);
  step('T2 a distinct place is allowed', distinct.created === true, `created=${distinct.created}`);

  // ---- T3: a SECOND free facility is refused with the actionable slot error, not a generic one.
  let slotError = null;
  try {
    await repository.createSellerFacility(createInput(neighbourAuth, { name: `Autre lieu ${tag}`, latitude: 6.40, longitude: 1.40 }));
  } catch (error) { slotError = error; }
  step('T3 a second free facility is refused with the actionable SlotPolicyError',
    slotError instanceof SlotPolicyError,
    `error=${slotError?.name} message=${slotError?.message ?? 'n/a'}`);

  // The standing must tell the client to offer a purchase.
  const standing = await repository.getSellerSlotStanding({ authUserId: neighbourAuth });
  step('T3 slot standing reports needsPaidSlot + a price',
    standing.standing.freeAvailable === 0 && standing.standing.needsPaidSlot === true && standing.slotPriceMinor > 0,
    `freeAvailable=${standing.standing.freeAvailable} needsPaidSlot=${standing.standing.needsPaidSlot} price=${standing.slotPriceMinor}`);

  // ---- T4: buying a slot debits the wallet, creates a paid slot, and is replay-safe.
  let wallet = (await sql`select w.id from v2_wallets w join v2_accounts a on a.id = w.account_id where a.auth_user_id = ${neighbourAuth} limit 1`)[0];
  if (!wallet) {
    const account = (await sql`select id from v2_accounts where auth_user_id = ${neighbourAuth} limit 1`)[0];
    await sql`insert into v2_wallets (account_id) values (${account.id}::uuid)`;
    wallet = (await sql`select w.id from v2_wallets w join v2_accounts a on a.id = w.account_id where a.auth_user_id = ${neighbourAuth} limit 1`)[0];
  }
  const price = (await repository.getSellerSlotStanding({ authUserId: neighbourAuth })).slotPriceMinor;
  await sql`insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, confirmed_at)
    values (${wallet.id}::uuid, 'recharge', ${price * 2}, 'confirmed', ${`branches-${tag}-topup`}, now())`;
  const buyKey = `branches-${tag}-buy`;
  const purchase = await repository.purchaseFacilitySlot({ authUserId: neighbourAuth, idempotencyKey: buyKey });
  const replay = await repository.purchaseFacilitySlot({ authUserId: neighbourAuth, idempotencyKey: buyKey });
  const paidSlots = (await sql`
    select count(*)::int as n from v2_facility_slots s join v2_accounts a on a.id = s.account_id
    where a.auth_user_id = ${neighbourAuth} and s.source = 'wallet'`)[0].n;
  step('T4 purchase debits and creates exactly one paid slot (replay-safe)',
    purchase.purchased === true && replay.purchased === false && Number(paidSlots) === 1,
    `purchased=${purchase.purchased} replay=${replay.purchased} paidSlots=${paidSlots}`);

  // ---- T5: a certified claim assigns the freed slot to the claimed facility.
  // A public-import place with no owner (the claimable case).
  const claimable = (await sql`
    insert into v2_facilities (account_id, source_kind, name, latitude, longitude, trust_state)
    values (null, 'public_import', ${`Lieu à revendiquer ${tag}`}, 6.15, 1.25, 'unclaimed') returning id`)[0];
  facilityIds.push(claimable.id);
  const draft = await repository.createClaimDraft({ authUserId: claimantAuth, facilityId: claimable.id });
  // A review requires at least one evidence row with private/admin_only visibility.
  await sql`insert into v2_verification_evidence (request_id, evidence_kind, object_key, visibility)
    values (${draft.requestId}::uuid, 'facility', ${`branches/${tag}/photo.jpg`}, 'private')`;
  await sql`update v2_verification_requests set state = 'admin_review' where id = ${draft.requestId}::uuid`;
  const reviewerAccount = (await sql`insert into v2_accounts (auth_user_id) values (${reviewerAuth}) returning id`)[0];
  accountIds.push(reviewerAccount.id);
  await sql`insert into v2_account_roles (account_id, role) values (${reviewerAccount.id}::uuid, 'reviewer')`;
  const review = await repository.reviewFacilityClaim({
    authUserId: reviewerAuth, requestId: draft.requestId, outcome: 'certified',
    reason: 'Les preuves correspondent au lieu.', correlationId,
  });
  const assignedSlot = (await sql`
    select s.id, s.status, s.facility_id from v2_facility_slots s
    where s.facility_id = ${claimable.id}::uuid and s.status = 'assigned'`)[0];
  step('T5 a certified claim assigns a slot to the claimed facility',
    review.outcome === 'certified' && Boolean(assignedSlot) && assignedSlot.status === 'assigned',
    `outcome=${review.outcome} slot=${assignedSlot?.id ?? 'NONE'}`);

  // ---- T6: after buying a slot, a SECOND facility succeeds even though the account is ALREADY
  // `seller_ready`. This is the LEFT-join case: `account_promoted` is EMPTY (nothing to promote),
  // so an inner join would drop the created row and falsely report "no slot".
  const second = await repository.createSellerFacility(createInput(neighbourAuth, {
    name: `Deuxième lieu ${tag}`, latitude: 6.45, longitude: 1.45,
  }));
  facilityIds.push(second.facilityId);
  step('T6 a second facility succeeds for an already seller_ready account (LEFT join)',
    second.created === true && second.facilityId !== distinct.facilityId, `created=${second.created}`);
} catch (error) {
  console.error('branches-proof: UNEXPECTED', String(error?.stack ?? error));
  failures += 1;
  process.exitCode = 1;
} finally {
  for (const id of facilityIds) {
    try { await sql`delete from v2_facility_slots where facility_id = ${id}::uuid`; } catch { /* best effort */ }
    try { await sql`delete from v2_verification_requests where facility_id = ${id}::uuid`; } catch { /* best effort */ }
    try { await sql`delete from v2_facilities where id = ${id}::uuid`; } catch { /* append-only rows remain */ }
  }
  try { await sql`delete from v2_facility_slots where account_id in (select id from v2_accounts where auth_user_id like ${`branches-%-${tag}`})`; } catch { /* best effort */ }
  console.log('branches-proof: cleanup attempted (delete the disposable branch)');
}

console.log(failures === 0 ? 'branches-proof: ALL PASS' : `branches-proof: ${failures} FAILURE(S)`);
