// Demo supply seeding — drives the REAL shipped repository code against the canonical DB.
//
// Goal: make the demo honest. Today the seller's 8 offers all sit at existence level 2
// (published, availability 'a_valider'), every one of them fails S-32's `visuel` integrity
// check (media = []), and none is transactable. The demo cannot show what Omni is until
// real offers reach level 4.
//
// What this does, per hero offer (Box dejeuner, Jus de gingembre, Panier fruits):
//   draft (media + description 10+ + 4 characteristics) -> published -> live availability
// and archives the three junk products left behind by proof runs.
//
// Wallet note: reaching live availability requires an active `facility_pro` entitlement
// (D-04). The paid path is createWalletRecharge -> FedaPay -> reconcileWalletRecharge. A real
// FedaPay payment cannot be driven from a script, so this credits the Wallet through the SAME
// reconcile function the webhook calls, and says so out loud. It is a deliberate demo
// shortcut, not a claim that a payment happened.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.DEMO_DATABASE_URL;
if (!dbUrl) { console.error('demo: missing DEMO_DATABASE_URL'); process.exit(2); }
if (process.env.DEMO_ALLOW_CANONICAL_WRITE !== '1') {
  console.error('demo: set DEMO_ALLOW_CANONICAL_WRITE=1 (this writes to the demo database)');
  process.exit(2);
}

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const BASE_URL = process.env.DEMO_BASE_URL ?? 'https://omni.sparkafrika.online';
const SELLER_ACCOUNT = '10000000-0000-0000-0000-000000000101'; // demo@seller.omni
const FACILITY = '20000000-0000-0000-0000-000000000101';
const PRO_AMOUNT_MINOR = 600000; // 6 000 XOF: covers the 5 000 XOF Pro month with headroom

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

const HEROES = {
  'Box déjeuner togolais': {
    slug: 'box-dejeuner',
    stock: 12,
    description: 'Box déjeuner togolais : riz, sauce arachide, poisson grillé. Prêt à emporter le midi.',
  },
  'Jus de gingembre frais': {
    slug: 'jus-gingembre',
    stock: 24,
    description: 'Jus de gingembre frais pressé du jour, sans sucre ajouté. Bouteille 50 cl.',
  },
  'Panier fruits de saison': {
    slug: 'panier-fruits',
    stock: 8,
    description: 'Panier de fruits de saison de Lomé : ananas, mangues, bananes. Environ 3 kg.',
  },
};
const JUNK = ['Root proof demo product', 'T-08 Offer 4a176da3', 'T-08 Offer 65488663'];

try {
  const seller = (await sql`select auth_user_id, onboarding_state from v2_accounts where id = ${SELLER_ACCOUNT}::uuid`)[0];
  if (!seller) throw new Error('seller account not found');
  const authUserId = seller.auth_user_id;
  console.log(`demo supply: seller=${authUserId} state=${seller.onboarding_state}`);

  // ---- 0. Retire the junk left by proof runs (archive, never delete: history stays true).
  for (const name of JUNK) {
    const rows = await sql`select p.id from v2_products p join v2_facilities f on f.id = p.facility_id
      where f.id = ${FACILITY}::uuid and p.name = ${name} and p.publication_state <> 'archived'`;
    for (const row of rows) {
      await repository.transitionSellerProduct({ authUserId, productId: String(row.id), to: 'archived' });
      console.log(`  archived junk product ${name}`);
    }
  }

  // ---- 1. Wallet credit: reconstruct the pending intent, then use the REAL reconcile.
  // `createWalletRecharge` refuses without FedaPay credentials (no real checkout can be created
  // here), so we insert the intent it would have inserted, with a `demo-seed-` reference, and
  // hand it to the SAME `reconcileWalletRecharge` the webhook calls. The ledger row is written
  // by the real code. This is a labelled demo shortcut, NOT a claim that a payment happened.
  const txn = `demo-seed-${randomUUID().slice(0, 8)}`;
  const intentRow = (await sql`
    insert into v2_wallet_recharge_intents (account_id, wallet_id, amount_minor, currency, idempotency_key, provider_transaction_id, checkout_url, status)
    select a.id, w.id, ${PRO_AMOUNT_MINOR}, 'XOF', ${`demo-seed-recharge-${randomUUID().slice(0, 8)}`}, ${txn}, 'https://demo.local/checkout', 'pending'
    from v2_accounts a join v2_wallets w on w.account_id = a.id
    where a.id = ${SELLER_ACCOUNT}::uuid and a.suspended_at is null
    returning id`)[0];
  step('demo recharge intent created (labelled demo-seed, not a real payment)', Boolean(intentRow?.id), `recharge=${intentRow?.id}`);
  const reconciled = await repository.reconcileWalletRecharge({
    providerTransactionId: txn, providerEventId: `${txn}:event`, status: 'approved',
    amountMinor: PRO_AMOUNT_MINOR, currency: 'XOF', omniRechargeId: intentRow ? String(intentRow.id) : null, now: new Date().toISOString(),
  });
  step('wallet credited through the real reconcile function', reconciled.status === 'confirmed',
    `recharge=${reconciled.rechargeId} ledger=${reconciled.ledgerEntryId} status=${reconciled.status}`);

  // ---- 2. Give each hero a real visual, description and the four characteristics, then publish.
  const published = [];
  for (const [name, spec] of Object.entries(HEROES)) {
    const row = (await sql`select p.id, p.name, p.description, p.unit, p.price_minor, p.currency,
        p.quantity_allocated_omni, p.publication_state
      from v2_products p join v2_facilities f on f.id = p.facility_id
      where f.id = ${FACILITY}::uuid and p.name = ${name} and p.publication_state <> 'archived'`)[0];
    if (!row) { step(`hero ${name} exists`, false); continue; }
    const productId = String(row.id);

    await repository.updateSellerProductDraft({
      authUserId, productId, name, description: spec.description,
      unit: String(row.unit ?? 'pièce'), prixOriginal: Number(row.price_minor),
      currency: String(row.currency ?? 'XOF'), pourcentageReduction: 10,
      stockLoueOmni: spec.stock,
      positionKind: 'fixe', uniquenessKind: 'renouvelable', handoverKind: 'retrait',
      priceKind: 'fixe', conditionKind: 'neuf',
    });

    await repository.setSellerProductMedia({
      authUserId, productId,
      media: [{ url: `${BASE_URL}/demo/${spec.slug}.png`, kind: 'image' }],
    });

    const done = await repository.transitionSellerProduct({ authUserId, productId, to: 'published' });
    published.push(productId);
    step(`hero "${name}" published (visual + description + 4 characteristics)`,
      done.publicationState === 'published', `product=${productId}`);
  }

  // ---- 3. Activate the facility Pro entitlement (needed for a LIVE availability, D-04).
  const pro = await repository.activateFacilityPro({
    authUserId, facilityId: FACILITY, reference: `demo-seed-pro-${randomUUID().slice(0, 8)}`,
    now: new Date().toISOString(),
  });
  step('facility Pro entitlement active', Boolean(pro.entitlementId), `endsAt=${pro.endsAt}`);

  // ---- 4. Declare a LIVE availability on each hero: this is what moves 2 -> 4.
  for (const productId of published) {
    const avail = await repository.setProductAvailability({
      authUserId, productId, to: 'en_stock', expiresInHours: 4,
    });
    step(`live availability on ${productId}`, avail.availabilityState === 'en_stock',
      `${avail.previousState} -> ${avail.availabilityState}`);
  }

  // ---- 5. Verify the levels the public read path will derive.
  const summary = await sql`
    select p.name, p.publication_state, p.availability_state, p.availability_expires_at,
           p.quantity_allocated_omni, p.quantity_reserved_omni,
           coalesce(jsonb_array_length(case when jsonb_typeof(p.media) = 'array' then p.media else '[]'::jsonb end), 0) as media_count
    from v2_products p where p.facility_id = ${FACILITY}::uuid and p.publication_state = 'published'
    order by p.name`;
  for (const row of summary) {
    const live = (row.availability_state === 'en_stock' || row.availability_state === 'verifie')
      && row.availability_expires_at && new Date(row.availability_expires_at) > new Date();
    const reservable = Math.max(0, Number(row.quantity_allocated_omni) - Number(row.quantity_reserved_omni));
    const level = live ? (reservable > 0 ? 4 : 3) : 2;
    console.log(`  level ${level}  ${row.name}  (media=${row.media_count}, avail=${row.availability_state}, reservable=${reservable})`);
  }
} catch (error) {
  console.error('demo: ABORT', error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log(failures === 0 ? '\ndemo supply: DONE' : `\ndemo supply: ${failures} FAILURE(S)`);
