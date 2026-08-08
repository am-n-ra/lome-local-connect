import { currentMonthKey, haversineKm, type SubscriptionRow } from "@/lib/omni";

export type AdCampaignRow = {
  id: string;
  facility_id: string;
  product_ids: string[];
  radius_km: number | null;
  is_city_wide: boolean;
  cost_fcfa: number;
  reach_estimate: number;
  created_at: string;
  campaign_active_until: string | null;
};

export type CouponRow = {
  id: string;
  facility_id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  created_at: string;
};

export type CartRow = {
  id: string;
  buyer_id: string;
  facility_id: string;
  status: string;
  created_at: string;
};

export type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
};

export type WishlistRow = {
  id: string;
  user_id: string;
  search_term: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export const RADIUS_OPTIONS = [1, 3, 5, 10] as const;
export const FREE_PRODUCT_CAP = 5;
export const QUALIFYING_AMOUNT = 5000;

export function campaignCostFor(radiusKm: number | null, cityWide: boolean): number {
  if (cityWide) return 4000;
  return 500 * (radiusKm ?? 0);
}

/** Approximate reach from seeded demand signals near the facility. */
export function estimateReach(
  wishlists: WishlistRow[],
  origin: { lat: number; lng: number },
  radiusKm: number | null,
  cityWide: boolean,
): number {
  const near = cityWide
    ? wishlists
    : wishlists.filter((w) => {
        if (w.latitude === null || w.longitude === null) return false;
        return haversineKm(origin, { lat: w.latitude, lng: w.longitude }) <= (radiusKm ?? 0);
      });
  const base = cityWide ? 4 : Math.max(1, radiusKm ?? 1);
  return Math.max(12, Math.round((near.length + 3) * base * 7));
}

export function campaignActive(c: AdCampaignRow): boolean {
  return !!c.campaign_active_until && new Date(c.campaign_active_until).getTime() > Date.now();
}

/**
 * Monthly re-evaluation: Pro is kept for a calendar month only if a deposit or
 * ad spend of at least 5 000 FCFA happened during that month.
 */
export function needsProDowngrade(sub: SubscriptionRow | null): boolean {
  if (!sub || sub.tier !== "pro") return false;
  const expired = !sub.pro_active_until || new Date(sub.pro_active_until).getTime() < Date.now();
  if (!expired) return false;
  return sub.last_qualifying_action_month !== currentMonthKey();
}

export function extendedProUntil(from: string | null): string {
  const base = from && new Date(from).getTime() > Date.now() ? new Date(from) : new Date();
  base.setMonth(base.getMonth() + 1);
  return base.toISOString().slice(0, 10);
}
