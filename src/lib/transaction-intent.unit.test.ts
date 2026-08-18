import { describe, expect, it } from "vitest";
import { buildTransactionIntentKey, type TransactionIntentKeyInput } from "./checkout.functions";

const base: TransactionIntentKeyInput = {
  source: "product",
  facilityId: "00000000-0000-0000-0000-000000000001",
  cartId: null,
  productId: "00000000-0000-0000-0000-000000000002",
  demandResponseId: null,
  quantity: 2,
  offerId: null,
  couponCode: null,
  baseAmount: 5000,
  amount: 5000,
};

describe("transaction intent fingerprint", () => {
  it("is stable for the same server-calculated intent", () => {
    expect(buildTransactionIntentKey(base)).toBe(buildTransactionIntentKey({ ...base }));
  });

  it.each([
    ["quantity", { quantity: 3 }],
    ["source", { source: "cart" as const }],
    ["coupon", { couponCode: "OMNI10" }],
    ["amount", { amount: 4500 }],
  ])("changes when %s changes", (_label, change) => {
    expect(buildTransactionIntentKey(base)).not.toBe(
      buildTransactionIntentKey({ ...base, ...change }),
    );
  });

  it("stays single-valued under concurrent identical calls", async () => {
    const keys = await Promise.all(
      Array.from({ length: 32 }, async () => buildTransactionIntentKey({ ...base })),
    );
    expect(new Set(keys)).toHaveLength(1);
  });
});
