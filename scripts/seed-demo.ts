import { neon } from "@neondatabase/serverless";

/**
 * Creates the demo accounts through Neon Auth and gives the vendor account a
 * realistic, claimed shop set on top of the imported OSM listings.
 *
 *   DATABASE_URL=... NEON_AUTH_BASE_URL=... bun scripts/seed-demo.ts
 */
const dbUrl = process.env["DATABASE_URL"];
const authBase = process.env["NEON_AUTH_BASE_URL"]?.replace(/\/$/, "");
if (!dbUrl || !authBase) {
  console.error("DATABASE_URL and NEON_AUTH_BASE_URL are required");
  process.exit(1);
}
const sql = neon(dbUrl);

const ACCOUNTS = [
  { email: "demo@omni.tg", password: "Demo1234!", name: "Kossi Adjo" },
  { email: "ama@omni.tg", password: "Demo1234!", name: "Ama Mensah" },
  { email: "yao@omni.tg", password: "Demo1234!", name: "Yao Kpodo" },
];

async function ensureAccount(account: (typeof ACCOUNTS)[number]): Promise<string> {
  const existing = await sql.query(`SELECT id FROM neon_auth."user" WHERE email = $1`, [
    account.email,
  ]);
  if ((existing as { id: string }[])[0]) return (existing as { id: string }[])[0]!.id;

  const response = await fetch(`${authBase}/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:8080" },
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    throw new Error(`sign-up failed for ${account.email}: ${response.status} ${await response.text()}`);
  }
  const rows = (await sql.query(`SELECT id FROM neon_auth."user" WHERE email = $1`, [
    account.email,
  ])) as { id: string }[];
  if (!rows[0]) throw new Error(`account ${account.email} not found after sign-up`);
  return rows[0].id;
}

const vendorId = await ensureAccount(ACCOUNTS[0]!);
const buyerAId = await ensureAccount(ACCOUNTS[1]!);
const buyerBId = await ensureAccount(ACCOUNTS[2]!);
console.log("accounts ready");

for (const [index, id] of [vendorId, buyerAId, buyerBId].entries()) {
  await sql.query(
    `INSERT INTO public.profiles (id, name, email, phone)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
    [id, ACCOUNTS[index]!.name, ACCOUNTS[index]!.email, `+228 90 00 00 0${index + 1}`],
  );
}

// --- demo shops -----------------------------------------------------------
const SHOPS = [
  {
    name: "Épicerie Adidogomé Plus",
    category: "food",
    neighbourhood: "Adidogomé",
    lat: 6.183,
    lng: 1.172,
    type: "fixe",
    description: "Produits frais, riz, huile et boissons au meilleur prix du quartier.",
    products: [
      ["Riz parfumé 5 kg", 6500],
      ["Huile végétale 5 L", 8200],
      ["Tomate concentrée", 500],
      ["Savon de Marseille", 350],
      ["Lait en poudre 400 g", 3200],
    ],
  },
  {
    name: "Électro Akodésséwa",
    category: "electronics",
    neighbourhood: "Akodésséwa",
    lat: 6.1445,
    lng: 1.2793,
    type: "fixe",
    description: "Téléphones, chargeurs, ventilateurs et petit électroménager.",
    products: [
      ["Chargeur rapide 25W", 7500],
      ["Ventilateur sur pied", 28000],
      ["Écouteurs Bluetooth", 12000],
      ["Multiprise parafoudre", 5500],
    ],
  },
  {
    name: "Boutique Mode Bè-Kpota",
    category: "fashion",
    neighbourhood: "Bè-Kpota",
    lat: 6.1372,
    lng: 1.2404,
    type: "fixe",
    description: "Pagnes, prêt-à-porter et couture sur mesure.",
    products: [
      ["Pagne wax 6 yards", 15000],
      ["Chemise homme", 9000],
      ["Sandales cuir", 12500],
    ],
  },
  {
    name: "Yovo Fruits — vendeur mobile",
    category: "food",
    neighbourhood: "Tokoin",
    lat: 6.1662,
    lng: 1.2185,
    type: "mobile",
    description: "Fruits de saison livrés à moto dans tout Lomé.",
    products: [
      ["Ananas pain de sucre", 1000],
      ["Mangue (kg)", 800],
      ["Papaye", 1200],
    ],
  },
];

for (const shop of SHOPS) {
  const rows = (await sql.query(
    `INSERT INTO public.facilities
       (market_code, owner_id, name, category, description, neighbourhood, latitude, longitude,
        phone, status, type, is_online, source, claimed_at)
     VALUES ('TG-LOME', $1, $2, $3, $4, $5, $6, $7, '+228 90 12 34 56', 'unconfirmed', $8, true, 'demo', now())
     RETURNING id`,
    [vendorId, shop.name, shop.category, shop.description, shop.neighbourhood, shop.lat, shop.lng, shop.type],
  )) as { id: string }[];
  const facilityId = rows[0]!.id;

  await sql.query(
    `INSERT INTO public.subscriptions (facility_id, tier, wallet_balance, pro_active_until, last_qualifying_action_month)
     VALUES ($1, 'free', 10000, NULL, NULL)
     ON CONFLICT (facility_id) DO NOTHING`,
    [facilityId],
  );

  for (const [name, price] of shop.products) {
    await sql.query(
      `INSERT INTO public.products (facility_id, name, price, in_stock, last_confirmed_at)
       VALUES ($1, $2, $3, true, now() - (random() * interval '20 hours'))`,
      [facilityId, name, price],
    );
  }

  await sql.query(
    `INSERT INTO public.coupons (facility_id, code, description, discount_percent)
     VALUES ($1, 'BIENVENUE10', 'Dix pour cent sur la première visite', 10)
     ON CONFLICT DO NOTHING`,
    [facilityId],
  );
}
console.log(`${SHOPS.length} demo shops created`);

// --- demand signals -------------------------------------------------------
const TERMS = [
  "riz parfumé",
  "ciment",
  "chargeur iphone",
  "pagne wax",
  "gaz butane",
  "ananas",
  "climatiseur",
  "farine de maïs",
];
for (const term of TERMS) {
  for (let i = 0; i < 1 + Math.floor(Math.random() * 4); i += 1) {
    await sql.query(
      `INSERT INTO public.wishlists (user_id, search_term, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, now() - (random() * interval '20 days'))`,
      [
        Math.random() > 0.5 ? buyerAId : buyerBId,
        term,
        6.13 + Math.random() * 0.08,
        1.19 + Math.random() * 0.09,
      ],
    );
  }
}
console.log("demand signals seeded");

// --- one pending buyer request -------------------------------------------
const first = (await sql.query(
  `SELECT f.id AS facility_id, p.id AS product_id, p.price
   FROM public.facilities f JOIN public.products p ON p.facility_id = f.id
   WHERE f.owner_id = $1 ORDER BY f.created_at LIMIT 1`,
  [vendorId],
)) as { facility_id: string; product_id: string; price: number }[];

if (first[0]) {
  const cart = (await sql.query(
    `INSERT INTO public.carts (buyer_id, facility_id, status) VALUES ($1, $2, 'pending') RETURNING id`,
    [buyerAId, first[0].facility_id],
  )) as { id: string }[];
  await sql.query(
    `INSERT INTO public.cart_items (cart_id, product_id, quantity, price_at_time)
     VALUES ($1, $2, 2, $3)`,
    [cart[0]!.id, first[0].product_id, first[0].price],
  );
}

console.log("done");
