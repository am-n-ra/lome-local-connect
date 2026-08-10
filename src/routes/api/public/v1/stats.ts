import { createFileRoute } from "@tanstack/react-router";
import { queryOne } from "@/lib/db.server";
import { guard, json, preflight } from "@/lib/public-api.server";

type PublicStats = {
  facilities: number;
  claimed: number;
  verified: number;
  confirmed: number;
  products: number;
  neighbourhoods: number;
};

export const Route = createFileRoute("/api/public/v1/stats")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        try {
          await guard(request);
        } catch {
          return json({ error: "rate_limited" }, 429);
        }
        const row = await queryOne<PublicStats>(`
          SELECT
            (SELECT count(*) FROM public.facilities)::int AS facilities,
            (SELECT count(*) FROM public.facilities WHERE status <> 'unclaimed')::int AS claimed,
            (SELECT count(*) FROM public.facilities WHERE status = 'certified')::int AS verified,
            (SELECT count(*) FROM public.facilities WHERE status = 'confirmed')::int AS confirmed,
            (SELECT count(*) FROM public.products)::int AS products,
            (SELECT count(DISTINCT neighbourhood) FROM public.facilities
              WHERE neighbourhood IS NOT NULL AND neighbourhood <> '')::int AS neighbourhoods
        `);
        return json({ data: row, market: "TG-LOME", currency: "XOF" });
      },
    },
  },
});
