import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { query, queryOne } from "@/lib/db.server";
import {
  guard,
  json,
  preflight,
  PUBLIC_FACILITY_SELECT,
  type PublicFacility,
} from "@/lib/public-api.server";

export const Route = createFileRoute("/api/public/v1/facilities/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        try {
          await guard(request);
        } catch {
          return json({ error: "rate_limited" }, 429);
        }
        const parsed = z.string().uuid().safeParse(params.id);
        if (!parsed.success) return json({ error: "invalid_id" }, 400);

        const facility = await queryOne<PublicFacility>(
          `${PUBLIC_FACILITY_SELECT} WHERE f.id = $1`,
          [parsed.data],
        );
        if (!facility) return json({ error: "not_found" }, 404);

        const products = await query<{
          id: string;
          name: string;
          price: number;
          discount_percent: number;
          in_stock: boolean;
        }>(
          `SELECT id, name, price, discount_percent, in_stock
           FROM public.products WHERE facility_id = $1 ORDER BY in_stock DESC, name ASC`,
          [parsed.data],
        );

        return json({ data: { ...facility, products } });
      },
    },
  },
});
