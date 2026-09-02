import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const rows = await sql`
  SELECT t.id, t.buyer_id, t.facility_id, f.name AS facility_name, t.status,
         t.amount, t.qr_token, t.qr_authorised_at, t.paid_at, t.completed_at,
         t.intent_created_at, t.created_at
  FROM public.transactions t
  JOIN public.facilities f ON f.id = t.facility_id
  WHERE t.qr_token = '9DGNQHHX'
     OR t.intent_metadata->>'search_term' = 'Omni QA Produit test'
  ORDER BY t.created_at DESC
`;
const events = rows.length ? await sql`
  SELECT transaction_id, event_type, actor_id, created_at
  FROM public.transaction_events
  WHERE transaction_id = ${rows[0].id}
  ORDER BY created_at ASC
` : [];
console.log(JSON.stringify({ rows, events }, null, 2));
