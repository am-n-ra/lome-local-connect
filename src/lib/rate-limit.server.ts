import { queryOne, query } from "./db.server";

/**
 * Fixed-window rate limiter backed by Postgres.
 * Server-only: keeps abuse control out of the browser's reach.
 */
export async function enforceRateLimit(input: {
  bucket: string;
  subject: string;
  limit: number;
  windowSeconds: number;
  message?: string;
}): Promise<void> {
  const windowStart = new Date(
    Math.floor(Date.now() / (input.windowSeconds * 1000)) * input.windowSeconds * 1000,
  ).toISOString();

  const row = await queryOne<{ hits: number }>(
    `INSERT INTO public.rate_limits (bucket, subject, window_start, hits)
     VALUES ($1, $2, $3::timestamptz, 1)
     ON CONFLICT (bucket, subject, window_start)
     DO UPDATE SET hits = public.rate_limits.hits + 1
     RETURNING hits`,
    [input.bucket, input.subject, windowStart],
  );

  // Opportunistic cleanup so the table never grows unbounded.
  if ((row?.hits ?? 0) % 50 === 0) {
    await query("DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day'");
  }

  if ((row?.hits ?? 0) > input.limit) {
    throw new Error(input.message ?? "Trop de requêtes. Réessayez dans quelques minutes.");
  }
}
