import { queryOne } from "./db.server";

export type DiscoveryScope = {
  plan: "free" | "pro";
  city: string | null;
  marketCode: string | null;
};

export async function getDiscoveryScope(userId: string | null | undefined): Promise<DiscoveryScope> {
  if (!userId) return { plan: "free", city: null, marketCode: null };
  const row = await queryOne<{
    plan: string | null;
    discovery_city: string | null;
    market_code: string | null;
  }>(
    `SELECT COALESCE(up.plan, 'free') AS plan,
            p.discovery_city,
            p.market_code
     FROM public.profiles p
     LEFT JOIN public.user_plans up ON up.user_id = p.id
     WHERE p.id = $1`,
    [userId],
  );
  return {
    plan: row?.plan === "pro" ? "pro" : "free",
    city: row?.discovery_city?.trim() || null,
    marketCode: row?.market_code?.trim() || null,
  };
}

/**
 * Applies the same server-authoritative boundary to map search and availability.
 * A resolved city is preferred; the legacy market is retained only for profiles
 * that have not completed location resolution yet.
 */
export function applyFreeDiscoveryScope(
  clauses: string[],
  params: unknown[],
  scope: DiscoveryScope,
  shouldApply: boolean,
  facilityAlias = "f",
): void {
  if (!shouldApply || scope.plan === "pro") return;
  if (scope.city) {
    params.push(scope.city);
    const cityIndex = params.length;
    if (scope.marketCode) {
      params.push(scope.marketCode);
      const marketIndex = params.length;
      clauses.push(
        `(lower(${facilityAlias}.city) = lower($${cityIndex}) OR
          (${facilityAlias}.city IS NULL AND ${facilityAlias}.market_code = $${marketIndex}))`,
      );
    } else {
      clauses.push(`lower(${facilityAlias}.city) = lower($${cityIndex})`);
    }
    return;
  }
  if (scope.marketCode) {
    params.push(scope.marketCode);
    clauses.push(`${facilityAlias}.market_code = $${params.length}`);
  }
}
