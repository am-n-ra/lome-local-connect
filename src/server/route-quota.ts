import { neon } from '@neondatabase/serverless';
import type { RoutingUnavailableReason } from '../trunk/types';

/**
 * RT-D1 — budget d'itinéraires (fondateur, 2026-09-17).
 *
 * Le risque mesurable n'est pas la fuite du jeton — il ne quitte pas le serveur —
 * mais la dépense : le fournisseur est facturé à la requête, et l'endpoint
 * acceptait n'importe quel appelant. Une limite en mémoire ne tient pas sur du
 * serverless (chaque instance a son compteur et se contourne en parallélisant),
 * donc on réutilise la base déjà facturée comme état partagé : aucun fournisseur
 * supplémentaire, aucune dépense nouvelle.
 *
 * Les valeurs sont larges à dessein : il s'agit de borner la dépense et de
 * couper les boucles automatiques, pas de rationner un vrai acheteur.
 */
export const ROUTE_QUOTA = {
  perHour: 60,
  perDay: 500,
} as const;

/** Fenêtres évaluées, de la plus courte à la plus longue. Le premier dépassement
 * rencontré donne le motif, pour un message utile au client. */
const WINDOWS: Array<{ reason: RoutingUnavailableReason; interval: string; limit: number }> = [
  { reason: 'QUOTA_HOURLY', interval: '1 hour', limit: ROUTE_QUOTA.perHour },
  { reason: 'QUOTA_DAILY', interval: '24 hours', limit: ROUTE_QUOTA.perDay },
];

/** Sous-ensemble de `neon()` réellement utilisé, injectable en test. */
export type QuotaSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;

export function routeQuotaSql(): QuotaSql | null {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url) as unknown as QuotaSql;
}

/**
 * Enregistre une consommation réellement servie. Jamais appelée sur un refus ou
 * une erreur : un itinéraire non fourni ne doit pas coûter de budget à l'acheteur.
 */
export async function recordRouteRequest(input: { authUserId: string; sql?: QuotaSql | null }): Promise<void> {
  const sql = input.sql === undefined ? routeQuotaSql() : input.sql;
  if (!sql) return;
  await sql`insert into v2_route_requests (auth_user_id) values (${input.authUserId})`;
}

/** Évite que la table de comptage croisse sans fin. Appelée par le cron existant,
 * jamais sur le chemin utilisateur. */
export async function pruneRouteRequests(input: { sql?: QuotaSql | null } = {}): Promise<void> {
  const sql = input.sql === undefined ? routeQuotaSql() : input.sql;
  if (!sql) return;
  await sql`delete from v2_route_requests where occurred_at < now() - interval '48 hours'`;
}

/**
 * Décide si cet utilisateur peut encore demander un itinéraire. `null` = oui.
 *
 * En l'absence de base configurée, on laisse passer : l'itinéraire n'est pas un
 * chemin monétaire et doit continuer de fonctionner quand la base est
 * indisponible — même raison pour laquelle la route est servie avant
 * `createTrunkRepository()`. Politique assumée : l'absence d'infrastructure ne
 * doit pas casser une fonctionnalité gratuite pour l'usager.
 */
export async function routeQuotaExceeded(input: { authUserId: string; sql?: QuotaSql | null }): Promise<RoutingUnavailableReason | null> {
  const sql = input.sql === undefined ? routeQuotaSql() : input.sql;
  if (!sql) return null;
  for (const window of WINDOWS) {
    const rows = (await sql`
      select count(*)::int as used
      from v2_route_requests
      where auth_user_id = ${input.authUserId}
        and occurred_at > now() - ${window.interval}::interval
    `) as Array<{ used: number }>;
    const used = Number(rows[0]?.used ?? 0);
    if (used >= window.limit) return window.reason;
  }
  return null;
}