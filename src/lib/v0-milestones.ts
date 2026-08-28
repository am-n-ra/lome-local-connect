import { isFresh } from "./omni";

export const V0_MILESTONE_SALES_TARGET = 3;
export const V0_SELLER_REWARD_FCFA = 10000; // ~$20 USD

export type SellerMilestoneStatus = {
  verifiedSalesCount: number;
  targetSalesCount: number;
  rewardUnlocked: boolean;
  rewardAmountFcfa: number;
};

/**
 * Calculates the V0 seller milestone progress and reward eligibility.
 * Sellers who complete 3 verified sales earn a $20 (10,000 FCFA) bonus in their wallet.
 */
export function evaluateSellerMilestone(completedSalesCount: number): SellerMilestoneStatus {
  const verifiedSalesCount = Math.max(0, Math.floor(completedSalesCount));
  const rewardUnlocked = verifiedSalesCount >= V0_MILESTONE_SALES_TARGET;

  return {
    verifiedSalesCount,
    targetSalesCount: V0_MILESTONE_SALES_TARGET,
    rewardUnlocked,
    rewardAmountFcfa: rewardUnlocked ? V0_SELLER_REWARD_FCFA : 0,
  };
}

/**
 * Checks whether an item or facility stock confirmation satisfies the V0 48h freshness guarantee.
 */
export function checkV0StockFreshness(lastConfirmedAt: string | null): {
  isFreshStock: boolean;
  maxAgeHours: number;
} {
  return {
    isFreshStock: isFresh(lastConfirmedAt),
    maxAgeHours: 48,
  };
}
