import { describe, expect, it } from "vitest";
import {
  checkV0StockFreshness,
  evaluateSellerMilestone,
  V0_MILESTONE_SALES_TARGET,
  V0_SELLER_REWARD_FCFA,
} from "./v0-milestones";

describe("V0 Seller Milestone Engine", () => {
  it("keeps reward locked when sales count is below target", () => {
    const status = evaluateSellerMilestone(2);
    expect(status.rewardUnlocked).toBe(false);
    expect(status.rewardAmountFcfa).toBe(0);
    expect(status.verifiedSalesCount).toBe(2);
    expect(status.targetSalesCount).toBe(V0_MILESTONE_SALES_TARGET);
  });

  it("unlocks 10,000 FCFA ($20) reward upon reaching 3 verified sales", () => {
    const status = evaluateSellerMilestone(3);
    expect(status.rewardUnlocked).toBe(true);
    expect(status.rewardAmountFcfa).toBe(V0_SELLER_REWARD_FCFA);
    expect(status.verifiedSalesCount).toBe(3);
  });

  it("maintains unlocked reward status for sales exceeding 3", () => {
    const status = evaluateSellerMilestone(5);
    expect(status.rewardUnlocked).toBe(true);
    expect(status.rewardAmountFcfa).toBe(V0_SELLER_REWARD_FCFA);
  });
});

describe("V0 48h Stock Freshness Guarantee", () => {
  it("flags stock confirmed within 48 hours as fresh", () => {
    const freshTimestamp = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const check = checkV0StockFreshness(freshTimestamp);
    expect(check.isFreshStock).toBe(true);
    expect(check.maxAgeHours).toBe(48);
  });

  it("flags stock older than 48 hours as not fresh", () => {
    const staleTimestamp = new Date(Date.now() - 50 * 3600 * 1000).toISOString();
    const check = checkV0StockFreshness(staleTimestamp);
    expect(check.isFreshStock).toBe(false);
  });

  it("handles null confirmation date as not fresh", () => {
    const check = checkV0StockFreshness(null);
    expect(check.isFreshStock).toBe(false);
  });
});
