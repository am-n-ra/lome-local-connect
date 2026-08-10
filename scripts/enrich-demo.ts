import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

const [vendor] = await sql`SELECT id FROM neon_auth."user" WHERE email = 'demo@omni.tg'` as {id:string}[];
if (!vendor) throw new Error("demo@omni.tg missing");
const shops = await sql`SELECT id, name, type FROM public.facilities WHERE owner_id = ${vendor.id} ORDER BY created_at` as {id:string;name:string;type:string}[];
if (!shops.length) throw new Error("no demo shops");
const main = shops[0]!;

// Main shop becomes a verified Pro shop with a funded wallet.
await sql`UPDATE public.facilities SET status='certified', verified_at=now(), is_online=true WHERE id=${main.id}`;
await sql`INSERT INTO public.subscriptions (facility_id, tier, wallet_balance, payout_balance, pro_active_until, last_qualifying_action_month)
          VALUES (${main.id}, 'pro', 42000, 18500, (now() + interval '25 days')::date, to_char(now(),'YYYY-MM'))
          ON CONFLICT (facility_id) DO UPDATE SET tier='pro', wallet_balance=42000, payout_balance=18500,
            pro_active_until=(now() + interval '25 days')::date, last_qualifying_action_month=to_char(now(),'YYYY-MM')`;

// Mandatory discounts on a few products + fresh confirmations.
await sql`UPDATE public.products SET discount_percent=10, last_confirmed_at=now() WHERE facility_id=${main.id}`;
await sql`UPDATE public.products SET discount_percent=20 WHERE facility_id=${main.id} AND price > 5000`;

// Active offer + coupon
await sql`INSERT INTO public.offers (facility_id, title, description, discount_percent, active_until)
          SELECT ${main.id}, 'Promo riz & huile', 'Vingt pour cent sur le riz et l''huile cette semaine.', 20, now() + interval '7 days'
          WHERE NOT EXISTS (SELECT 1 FROM public.offers WHERE facility_id=${main.id})`;
await sql`INSERT INTO public.coupons (facility_id, code, description, discount_percent)
          VALUES (${main.id}, 'OMNI15', 'Quinze pour cent pour les clients OmniView', 15)
          ON CONFLICT DO NOTHING`;

// Active ad campaign
const prods = await sql`SELECT id FROM public.products WHERE facility_id=${main.id} LIMIT 3` as {id:string}[];
await sql`INSERT INTO public.ad_campaigns (facility_id, product_ids, radius_km, is_city_wide, cost_fcfa, reach_estimate, campaign_active_until)
          SELECT ${main.id}, ${prods.map(p=>p.id)}::uuid[], 3, false, 3000, 4200, now() + interval '5 days'
          WHERE NOT EXISTS (SELECT 1 FROM public.ad_campaigns WHERE facility_id=${main.id} AND campaign_active_until > now())`;

// Mobile shop live presence
const mobile = shops.find(s => s.type === 'mobile');
if (mobile) {
  await sql`UPDATE public.facilities SET is_online=true, last_position_update=now() WHERE id=${mobile.id}`;
  await sql`INSERT INTO public.mobile_presence (facility_id, active, latitude, longitude, last_position_update)
            VALUES (${mobile.id}, true, 6.1662, 1.2185, now())
            ON CONFLICT (facility_id) DO UPDATE SET active=true, last_position_update=now()`;
}

// A couple of buyer requests in different states
const buyers = await sql`SELECT id FROM public.profiles WHERE id <> ${vendor.id} LIMIT 2` as {id:string}[];
const items = await sql`SELECT id, price FROM public.products WHERE facility_id=${main.id} LIMIT 2` as {id:string;price:number}[];
for (const [i, buyer] of buyers.entries()) {
  const status = i === 0 ? 'pending' : 'accepted';
  const existing = await sql`SELECT id FROM public.carts WHERE facility_id=${main.id} AND buyer_id=${buyer.id} AND status=${status}` as {id:string}[];
  if (existing.length) continue;
  const [cart] = await sql`INSERT INTO public.carts (buyer_id, facility_id, status) VALUES (${buyer.id}, ${main.id}, ${status}) RETURNING id` as {id:string}[];
  const p = items[i % items.length]!;
  await sql`INSERT INTO public.cart_items (cart_id, product_id, quantity, price_at_time) VALUES (${cart!.id}, ${p.id}, ${i+1}, ${p.price})`;
}

console.log("demo account enriched:", main.name);
