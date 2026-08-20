import { query } from "./db.server";

export type AutoAnswer = {
  facility_id: string;
  facility_name: string;
  owner_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  kind: "available" | "partial";
};

/**
 * Automatic availability answers.
 *
 * An answer is produced ONLY when both conditions hold at the same time:
 *   1. the facility is open (manual toggle AND online flag), and
 *   2. the matched product has `quantity_allocated_omni > 0`.
 *
 * Anything else falls back to the manual seller flow. The seller is always
 * notified of an answer made in their name and can correct it immediately.
 */
export async function autoAnswerDemand(input: {
  requestId: string;
  buyerId: string;
  searchTerm: string;
  quantity: number;
  facilityIds: string[];
}): Promise<number> {
  if (input.facilityIds.length === 0) return 0;

  const candidates = await query<AutoAnswer>(
    `SELECT f.id AS facility_id, f.name AS facility_name, f.owner_id,
            m.name AS product_name,
            (m.price - (m.price * COALESCE(m.discount_percent, 0) / 100))::int AS price,
            LEAST(m.quantity_allocated_omni, $3::int) AS quantity,
            CASE WHEN m.quantity_allocated_omni >= $3::int THEN 'available' ELSE 'partial' END AS kind
     FROM public.facilities f
     JOIN LATERAL (
       SELECT p.name, p.price, p.discount_percent, p.quantity_allocated_omni
       FROM public.products p
       WHERE p.facility_id = f.id
         AND p.name ILIKE '%' || $2 || '%'
         AND COALESCE(p.status, 'active') = 'active'
         AND p.in_stock = true
         AND p.quantity_allocated_omni > 0
       ORDER BY p.quantity_allocated_omni DESC
       LIMIT 1
     ) m ON true
     WHERE f.id = ANY($1::uuid[])
       AND f.owner_id IS NOT NULL
       AND f.is_online = true
       AND COALESCE(f.manual_open, true) = true`,
    [input.facilityIds, input.searchTerm.trim(), input.quantity],
  );

  let answered = 0;
  for (const c of candidates) {
    const inserted = await query<{ id: string }>(
      `INSERT INTO public.demand_responses
         (request_id, facility_id, available, kind, price, quantity, message, auto)
       VALUES ($1,$2,true,$3,$4,$5,$6,true)
       ON CONFLICT (request_id, facility_id) DO NOTHING
       RETURNING id`,
      [
        input.requestId,
        c.facility_id,
        c.kind,
        c.price,
        c.quantity,
        `Réponse automatique depuis le stock alloué à Omni (${c.product_name}).`,
      ],
    );
    if (inserted.length === 0) continue;
    answered += 1;

    if (c.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          c.owner_id,
          "Réponse automatique envoyée en votre nom",
          `« ${input.searchTerm.trim() } » a été confirmé (${c.quantity}) depuis votre stock alloué chez ${c.facility_name}. Corrigez si ce n’est pas exact.`,
          `/vendeur?correctResponse=${inserted[0]!.id}`,
        ],
      );
    }
    await query(
      `INSERT INTO public.notifications (user_id, title, body, link)
       VALUES ($1,$2,$3,$4)`,
      [
        input.buyerId,
        "Disponibilité confirmée",
        `${c.facility_name} : ${c.kind === "available" ? "disponible" : "partiellement disponible"} pour « ${input.searchTerm.trim()} ».`,
        `/?requestId=${encodeURIComponent(input.requestId)}&responseId=${encodeURIComponent(inserted[0]!.id)}`,
      ],
    );
  }
  return answered;
}
