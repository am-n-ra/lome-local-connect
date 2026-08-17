import { describe, expect, it } from "vitest";
import { normaliseStatus, verifyWebhookSignature } from "./fedapay.server";
import { WALLET_BUCKETS } from "./wallet.server";

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
    const timestamp = "1700000000";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${rawBody}`),
    );
    const hex = Array.from(new Uint8Array(signature))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");

    const previous = process.env["FEDAPAY_WEBHOOK_SECRET"];
    process.env["FEDAPAY_WEBHOOK_SECRET"] = secret;
    try {
      await expect(verifyWebhookSignature(rawBody, `t=${timestamp},s=${hex}`)).resolves.toBe(true);
      await expect(verifyWebhookSignature(`${rawBody} `, `t=${timestamp},s=${hex}`)).resolves.toBe(
        false,
      );
      await expect(verifyWebhookSignature(rawBody, "t=bad")).resolves.toBe(false);
    } finally {
      if (previous === undefined) delete process.env["FEDAPAY_WEBHOOK_SECRET"];
      else process.env["FEDAPAY_WEBHOOK_SECRET"] = previous;
    }
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
