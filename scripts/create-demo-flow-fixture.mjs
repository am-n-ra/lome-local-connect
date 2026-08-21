import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const ownerId = "a8c23f6a-84a9-452c-8be6-f0278060e436";
const sourceRef = "omni-qa-demo-flow-20260816";

const existing = await sql`
  SELECT id FROM public.facilities WHERE source = 'omni_qa' AND source_ref = ${sourceRef} LIMIT 1
`;
let facilityId = existing[0]?.id;
if (!facilityId) {
  const inserted = await sql`
    INSERT INTO public.facilities
      (market_code, owner_id, name, category, description, address, neighbourhood,
       latitude, longitude, status, type, is_online, source, source_ref)
    VALUES
      ('TG-LOME', ${ownerId}, 'Omni QA — Fixture Seller', 'hardware',
       'Fixture de vérification production Omni — ne pas utiliser pour une vente réelle.',
       'Zone de test Omni', 'Lomé test', 6.1725, 1.2314, 'unconfirmed', 'fixe', true,
       'omni_qa', ${sourceRef})
    RETURNING id
  `;
  facilityId = inserted[0].id;
}

const existingProduct = await sql`
  SELECT id FROM public.products WHERE facility_id = ${facilityId} AND name = 'Omni QA Produit test' LIMIT 1
`;
let productId = existingProduct[0]?.id;
if (!productId) {
  const insertedProduct = await sql`
    INSERT INTO public.products
      (facility_id, name, price, discount_percent, in_stock, status, quantity_available, omni_allocation_percent)
    VALUES (${facilityId}, 'Omni QA Produit test', 1250, 1, true, 'active', 12, 100)
    RETURNING id
  `;
  productId = insertedProduct[0].id;
}

await sql`
  INSERT INTO public.subscriptions (facility_id, tier)
  VALUES (${facilityId}, 'pro')
  ON CONFLICT (facility_id) DO NOTHING
`;

console.log(JSON.stringify({ ownerId, facilityId, productId, sourceRef }, null, 2));
