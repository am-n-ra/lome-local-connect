import { neon } from "@neondatabase/serverless";

if (process.env.OMNI_E2E_TARGET !== "staging" || process.env.OMNI_E2E_ALLOW_MUTATION !== "1") {
  throw new Error(
    "Refus de muter la base : définissez OMNI_E2E_TARGET=staging et OMNI_E2E_ALLOW_MUTATION=1 dans un environnement staging isolé.",
  );
}

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
const ownerId = process.env.OMNI_E2E_SELLER_ID;
const buyerId = process.env.OMNI_E2E_BUYER_ID;
if (!databaseUrl || !ownerId || !buyerId) {
  throw new Error("DATABASE_URL, OMNI_E2E_SELLER_ID et OMNI_E2E_BUYER_ID sont requis.");
}

const sql = neon(databaseUrl);
const sourceRef = `omni-e2e-staging-${process.env.OMNI_E2E_RUN_ID ?? "default"}`;
const facilityRows = await sql`
  INSERT INTO public.facilities
    (market_code, owner_id, name, category, description, address, neighbourhood,
     latitude, longitude, status, type, is_online, source, source_ref)
  VALUES
    ('TG-LOME', ${ownerId}, 'Omni E2E Staging Seller', 'hardware',
     'Fixture transactionnelle staging — aucune vente réelle.', 'Zone staging Omni',
     'Lomé staging', 6.1725, 1.2314, 'confirmed', 'fixe', true, 'omni_e2e_staging', ${sourceRef})
  ON CONFLICT (source, source_ref) DO UPDATE SET owner_id = EXCLUDED.owner_id
  RETURNING id
`;
const facilityId = facilityRows[0]?.id;
if (!facilityId) throw new Error("La facility E2E n’a pas été créée.");
const existingProduct = await sql`
  SELECT id FROM public.products
  WHERE facility_id = ${facilityId} AND name = 'Omni E2E Produit'
  ORDER BY created_at DESC LIMIT 1
`;
const productRows = existingProduct.length
  ? existingProduct
  : await sql`
      INSERT INTO public.products
        (facility_id, name, price, discount_percent, in_stock, status, quantity_available, omni_allocation_percent)
      VALUES (${facilityId}, 'Omni E2E Produit', 1250, 0, true, 'active', 12, 100)
      RETURNING id
    `;
await sql`
  INSERT INTO public.subscriptions (facility_id, tier)
  VALUES (${facilityId}, 'pro')
  ON CONFLICT (facility_id) DO NOTHING
`;
console.log(JSON.stringify({ sourceRef, facilityId, productId: productRows[0]?.id ?? null, buyerId, ownerId }, null, 2));
