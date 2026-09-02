import { createFileRoute } from "@tanstack/react-router";
import {
  guard,
  json,
  listPublicFacilities,
  listQuerySchema,
  preflight,
} from "@/lib/public-api.server";

export const Route = createFileRoute("/api/public/v1/facilities")({
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
        const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
          return json({ error: "invalid_query", details: parsed.error.flatten() }, 400);
        }
        const data = await listPublicFacilities(parsed.data);
        return json({
          data,
          paging: { limit: parsed.data.limit, offset: parsed.data.offset, count: data.length },
        });
      },
    },
  },
});
