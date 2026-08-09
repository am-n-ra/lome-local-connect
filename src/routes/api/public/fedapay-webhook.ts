import { createFileRoute } from "@tanstack/react-router";

/**
 * FedaPay webhook: credits the vendor wallet once a deposit is approved.
 * Public prefix, so the signature is verified before anything is written.
 */
export const Route = createFileRoute("/api/public/fedapay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyWebhookSignature, creditDeposit } = await import(
          "@/lib/fedapay.server"
        );

        const valid = await verifyWebhookSignature(
          raw,
          request.headers.get("x-fedapay-signature"),
        );
        if (!valid) return new Response("Invalid signature", { status: 401 });

        let payload: {
          id?: number | string;
          name?: string;
          entity?: { id?: number; status?: string; custom_metadata?: { deposit_id?: string } };
        };
        try {
          payload = JSON.parse(raw) as typeof payload;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { query, queryOne } = await import("@/lib/db.server");
        await query(
          `INSERT INTO public.fedapay_webhook_events (event_id, event_name, payload)
           VALUES ($1, $2, $3::jsonb) ON CONFLICT (event_id) DO NOTHING`,
          [payload.id ? String(payload.id) : null, payload.name ?? null, raw],
        );

        const entity = payload.entity;
        if (!entity?.status) return new Response("ok");

        const depositId =
          entity.custom_metadata?.deposit_id ??
          (
            await queryOne<{ id: string }>(
              "SELECT id FROM public.wallet_deposits WHERE provider_txn_id = $1",
              [String(entity.id ?? "")],
            )
          )?.id;
        if (!depositId) return new Response("ok");

        await creditDeposit(depositId, entity.status);
        return new Response("ok");
      },
    },
  },
});
