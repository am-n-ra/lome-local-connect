import { describe, expect, it } from "vitest";
import { Webhook } from "fedapay";
import {
  normaliseStatus,
  validateFedaPayDeposit,
  verifyWebhookSignature,
} from "./fedapay.server";
import { WALLET_BUCKETS } from "./wallet.server";
import { isValidTransactionCode, newTransactionCode } from "./qr";

describe("FedaPay status normalization", () => {
  it.each([
    ["approved", "approved"],
    ["transferred", "approved"],
    ["pending", "pending"],
    ["processing", "pending"],
    ["declined", "declined"],
    ["failed", "declined"],
    ["expired", "declined"],
    ["canceled", "canceled"],
  ] as const)("maps %s to %s", (providerStatus, expected) => {
    expect(normaliseStatus(providerStatus)).toBe(expected);
  });
});

describe("FedaPay webhook signature", () => {
  it("accepts a valid timestamped HMAC signature", async () => {
    const secret = "unit-test-webhook-secret";
    const rawBody = JSON.stringify({ id: "evt_1", status: "approved" });
    const header = Webhook.generateTestHeaderString({
      payload: rawBody,
      secret,
      timestamp: Date.now() / 1000,
    });

    const previous = process.env["FEDAPAY_WEBHOOK_SECRET"];
    process.env["FEDAPAY_WEBHOOK_SECRET"] = secret;
    try {
      await expect(verifyWebhookSignature(rawBody, header)).resolves.toBe(true);
      await expect(verifyWebhookSignature(`${rawBody} `, header)).resolves.toBe(false);
      await expect(verifyWebhookSignature(rawBody, "t=bad")).resolves.toBe(false);
    } finally {
      if (previous === undefined) delete process.env["FEDAPAY_WEBHOOK_SECRET"];
      else process.env["FEDAPAY_WEBHOOK_SECRET"] = previous;
    }
  });
});

describe("FedaPay deposit validation", () => {
  const approved = {
    status: "approved",
    amount: 5000,
    currencyIso: "XOF",
    depositId: "deposit-1",
  } as const;

  it("accepts the exact approved XOF deposit", () => {
    expect(() => validateFedaPayDeposit("deposit-1", 5000, approved)).not.toThrow();
  });

  it.each([
    ["amount", { amount: 4999 }],
    ["currency", { currencyIso: "USD" }],
    ["deposit metadata", { depositId: "deposit-2" }],
    ["status", { status: "pending" }],
  ])("rejects a provider %s mismatch", (_label, change) => {
    expect(() =>
      validateFedaPayDeposit("deposit-1", 5000, { ...approved, ...change }),
    ).toThrow();
  });
});

describe("transaction QR code contract", () => {
  it("generates an 8-character code accepted by manual fallback", () => {
    const code = newTransactionCode();
    expect(code).toHaveLength(8);
    expect(isValidTransactionCode(code)).toBe(true);
    expect(isValidTransactionCode(`${code}0`)).toBe(false);
    expect(isValidTransactionCode("O0I1AAAA")).toBe(false);
  });
});

describe("wallet bucket contract", () => {
  it("keeps the five buckets in a stable order", () => {
    expect(WALLET_BUCKETS).toEqual([
      "wallet",
      "payout",
      "ad_credit",
      "coupon_credit",
      "pro_credit",
    ]);
  });
});
