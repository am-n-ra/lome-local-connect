import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon Postgres access for server functions and server routes only.
 * The `.server.ts` extension keeps this out of every client bundle.
 */
let client: NeonQueryFunction<false, false> | undefined;

export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL is not configured");
    client = neon(url);
  }
  return client;
}

/** Parameterised query helper: rows are returned as plain objects. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const rows = await db().query(text, params);
  return rows as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
