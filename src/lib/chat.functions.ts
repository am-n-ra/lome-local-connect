import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";

export type ChatThread = {
  facility_id: string;
  buyer_id: string;
  facility_name: string;
  buyer_name: string | null;
  last_body: string;
  last_at: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  sender_role: "buyer" | "seller";
  body: string;
  created_at: string;
};

async function roleFor(userId: string, facilityId: string): Promise<"buyer" | "seller"> {
  const owned = await queryOne<{ id: string }>(
    "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
    [facilityId, userId],
  );
  return owned ? "seller" : "buyer";
}

/** Every conversation the current user takes part in, as buyer or as seller. */
export const listChatThreads = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    query<ChatThread>(
      `SELECT DISTINCT ON (m.facility_id, m.buyer_id)
              m.facility_id, m.buyer_id, f.name AS facility_name, p.name AS buyer_name,
              m.body AS last_body, m.created_at AS last_at,
              (SELECT count(*)::int FROM public.messages u
                WHERE u.facility_id = m.facility_id AND u.buyer_id = m.buyer_id
                  AND u.read_at IS NULL AND u.sender_id <> $1) AS unread
       FROM public.messages m
       JOIN public.facilities f ON f.id = m.facility_id
       JOIN public.profiles p ON p.id = m.buyer_id
       WHERE m.buyer_id = $1 OR f.owner_id = $1
       ORDER BY m.facility_id, m.buyer_id, m.created_at DESC`,
      [context.userId],
    ),
  );

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        buyerId: z.string().uuid().optional(),
        transactionId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await roleFor(context.userId, data.facilityId);
    const transaction = data.transactionId
      ? await queryOne<{ id: string; buyer_id: string; facility_id: string }>(
          `SELECT id, buyer_id, facility_id FROM public.transactions
           WHERE id = $1 AND facility_id = $2 AND (buyer_id = $3 OR EXISTS (
             SELECT 1 FROM public.facilities f WHERE f.id = $2 AND f.owner_id = $3
           ))`,
          [data.transactionId, data.facilityId, context.userId],
        )
      : null;
    if (data.transactionId && !transaction) throw new Error("Transaction non autorisée.");
    const buyerId = transaction?.buyer_id ?? (role === "seller" ? data.buyerId : context.userId);
    if (!buyerId) throw new Error("Conversation introuvable.");

    const messages = await query<ChatMessage>(
      `SELECT id, sender_role, body, created_at
       FROM public.messages
       WHERE facility_id = $1 AND buyer_id = $2
         AND (($3::uuid IS NULL AND transaction_id IS NULL) OR transaction_id = $3::uuid)
       ORDER BY created_at ASC LIMIT 200`,
      [data.facilityId, buyerId, data.transactionId ?? null],
    );
    await query(
      `UPDATE public.messages SET read_at = now()
       WHERE facility_id = $1 AND buyer_id = $2
         AND (($4::uuid IS NULL AND transaction_id IS NULL) OR transaction_id = $4::uuid)
         AND sender_id <> $3 AND read_at IS NULL`,
      [data.facilityId, buyerId, context.userId, data.transactionId ?? null],
    );
    return { role, buyerId, messages };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        buyerId: z.string().uuid().optional(),
        cartId: z.string().uuid().nullable().optional(),
        transactionId: z.string().uuid().optional(),
        body: z.string().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await roleFor(context.userId, data.facilityId);
    const transaction = data.transactionId
      ? await queryOne<{ id: string; buyer_id: string }>(
          `SELECT t.id, t.buyer_id FROM public.transactions t
           WHERE t.id = $1 AND t.facility_id = $2 AND (t.buyer_id = $3 OR EXISTS (
             SELECT 1 FROM public.facilities f WHERE f.id = $2 AND f.owner_id = $3
           ))`,
          [data.transactionId, data.facilityId, context.userId],
        )
      : null;
    if (data.transactionId && !transaction) throw new Error("Transaction non autorisée.");
    const buyerId = transaction?.buyer_id ?? (role === "seller" ? data.buyerId : context.userId);
    if (!buyerId) throw new Error("Conversation introuvable.");

    await query(
      `INSERT INTO public.messages
         (facility_id, buyer_id, cart_id, transaction_id, sender_id, sender_role, body)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        data.facilityId,
        buyerId,
        data.cartId ?? null,
        data.transactionId ?? null,
        context.userId,
        role,
        data.body.trim(),
      ],
    );

    const facility = await queryOne<{ owner_id: string | null; name: string }>(
      "SELECT owner_id, name FROM public.facilities WHERE id = $1",
      [data.facilityId],
    );
    const recipient = role === "seller" ? buyerId : facility?.owner_id;
    if (recipient) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          recipient,
          "Nouveau message",
          role === "seller" ? `${facility?.name} vous a répondu.` : "Un acheteur vous a écrit.",
          role === "seller" ? "/carte" : "/vendeur",
        ],
      );
    }
    return { ok: true };
  });
