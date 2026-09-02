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

type MarketInfo = {
  market_code: string;
  currency_code: string;
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
        const url = new URL(request.url);
        const marketCode = url.searchParams.get("market_code") ?? "TG-LOME";
        const row = await queryOne<PublicStats>(
          `
          SELECT
            (SELECT count(*) FROM public.facilities
              WHERE market_code = $1)::int AS facilities,
            (SELECT count(*) FROM public.facilities
              WHERE market_code = $1 AND status <> 'unclaimed')::int AS claimed,
            (SELECT count(*) FROM public.facilities
              WHERE market_code = $1 AND status = 'certified')::int AS verified,
            (SELECT count(*) FROM public.facilities
              WHERE market_code = $1 AND status = 'confirmed')::int AS confirmed,
            (SELECT count(*) FROM public.products p
              JOIN public.facilities f ON f.id = p.facility_id
              WHERE f.market_code = $1)::int AS products,
            (SELECT count(DISTINCT neighbourhood) FROM public.facilities
              WHERE market_code = $1 AND neighbourhood IS NOT NULL AND neighbourhood <> '')::int AS neighbourhoods
        `,
          [marketCode],
        );
        const market = await queryOne<MarketInfo>(
          "SELECT market_code, currency_code FROM public.markets WHERE market_code = $1",
          [marketCode],
        );
        return json({
          data: row,
          market: market?.market_code ?? marketCode,
          currency: market?.currency_code ?? "XOF",
        });
      },
    },
  },
});
