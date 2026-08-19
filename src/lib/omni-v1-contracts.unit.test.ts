import { describe, expect, it } from "vitest";
import {
  MAX_AVAILABILITY_TARGETS,
  buildTransactionLink,
  canSubmitAvailabilityResponse,
  canRenderPersonalLocationMarker,
  canTransitionTransaction,
  classifyLocationAccuracy,
  canTransitionWalletRecharge,
  deriveTransactionPrimaryAction,
  deriveTransactionRoomAccess,
  deriveTransactionRoomAction,
  paymentPreference,
  toSellerAvailabilityPayload,
  validateAvailabilityInput,
} from "./omni-v1-contracts";

describe("Omni V1 location contracts", () => {
  it("distinguishes precise, approximate and unknown browser accuracy", () => {
    expect(classifyLocationAccuracy(120)).toBe("precise");
    expect(classifyLocationAccuracy(500)).toBe("precise");
    expect(classifyLocationAccuracy(501)).toBe("approximate");
    expect(classifyLocationAccuracy(null)).toBe("unknown");
  });

  it("does not render a personal marker from a stale session coordinate", () => {
    expect(canRenderPersonalLocationMarker(false, 80)).toBe(false);
    expect(canRenderPersonalLocationMarker(true, 80)).toBe(true);
    expect(canRenderPersonalLocationMarker(true, 900)).toBe(false);
  });
});

describe("Omni V1 availability contracts", () => {
  it("keeps single-target availability available when bulk is constrained", () => {
    expect(
      validateAvailabilityInput({
        productQuery: "ciment",
        quantity: 2,
        facilityIds: ["facility-1"],
      }),
    ).toEqual({ ok: true, mode: "single", targetCount: 1 });

    expect(
      validateAvailabilityInput({
        productQuery: "ciment",
        quantity: 2,
        facilityIds: Array.from({ length: MAX_AVAILABILITY_TARGETS + 1 }, (_, i) => `f-${i}`),
      }),
    ).toEqual({ ok: false, reason: "too_many_targets" });
  });

  it("never forwards the buyer budget to the seller payload", () => {
    const payload = toSellerAvailabilityPayload(
      {
        productQuery: "ciment",
        quantity: 2,
        facilityIds: ["facility-1"],
        maxBudgetFcfa: 12500,
      },
      "facility-1",
    );

    expect(payload).toEqual({ productQuery: "ciment", quantity: 2, facilityId: "facility-1" });
    expect(payload).not.toHaveProperty("maxBudgetFcfa");
  });

  it("allows a seller response only while the request is open", () => {
    expect(canSubmitAvailabilityResponse("awaiting_seller")).toBe(true);
    expect(canSubmitAvailabilityResponse("available")).toBe(false);
    expect(canSubmitAvailabilityResponse("sla_expired")).toBe(false);
  });
});

describe("Omni V1 transaction contracts", () => {
  it("keeps immediate QR generation as the canonical path and rejects illegal jumps", () => {
    expect(canTransitionTransaction("pending", "qr_generated")).toBe(true);
    expect(canTransitionTransaction("pending", "payment_pending")).toBe(false);
    expect(canTransitionTransaction("qr_generated", "qr_verified")).toBe(true);
    expect(canTransitionTransaction("expired", "qr_generated")).toBe(true);
    expect(canTransitionTransaction("fulfillment", "received")).toBe(true);
    expect(canTransitionTransaction("fulfillment", "rating_pending")).toBe(true);
    expect(canTransitionTransaction("fulfillment", "completed")).toBe(false);
    expect(canTransitionTransaction("received", "rating_pending")).toBe(true);
    expect(canTransitionTransaction("rating_pending", "completed")).toBe(true);
  });

  it("exposes one role-specific primary action at a time", () => {
    expect(deriveTransactionPrimaryAction("buyer", "pending")).toEqual({
      id: "regenerate_qr",
      label: "Générer le QR",
    });
    expect(deriveTransactionPrimaryAction("seller", "qr_generated")).toEqual({
      id: "verify_qr",
      label: "Scanner le QR",
    });
    expect(deriveTransactionPrimaryAction("buyer", "payment_pending", false)).toEqual({
      id: "declare_paid",
      label: "J’ai payé",
    });
    expect(deriveTransactionPrimaryAction("seller", "payment_pending", true)).toEqual({
      id: "confirm_payment",
      label: "Confirmer l’encaissement",
    });
    expect(deriveTransactionPrimaryAction("buyer", "rating_pending")).toEqual({
      id: "rate_transaction",
      label: "Noter la transaction",
    });
    expect(deriveTransactionPrimaryAction("buyer", "completed")).toBeNull();
  });

  it("discloses remote seller contact only after QR verification", () => {
    expect(paymentPreference("cash_on_delivery")).toMatchObject({
      remote: false,
      sellerContactDisclosure: "none",
    });
    expect(paymentPreference("tmoney")).toMatchObject({
      remote: true,
      sellerContactDisclosure: "after_qr_verified",
    });
  });

  it("creates a non-sensitive token link without embedding transaction details", () => {
    const link = buildTransactionLink("https://omni.example", "qr-token-123");
    expect(link).toBe("https://omni.example/transaction/qr?token=qr-token-123");
    expect(link).not.toContain("buyer");
    expect(link).not.toContain("price");
  });
});

describe("Omni V1 transaction room contracts", () => {
  it("keeps the map unchanged while deriving one resumable action per role", () => {
    expect(deriveTransactionRoomAction("buyer", "pending", { hasQr: true })).toBe("present_qr");
    expect(deriveTransactionRoomAction("seller", "qr_generated", { hasQr: true })).toBe(
      "verify_qr",
    );
    expect(deriveTransactionRoomAction("buyer", "qr_verified")).toBe("choose_payment");
    expect(
      deriveTransactionRoomAction("buyer", "payment_pending", {
        paymentChoice: "mobile_money",
        buyerPaymentDeclared: false,
      }),
    ).toBe("declare_paid");
    expect(
      deriveTransactionRoomAction("seller", "payment_pending", { buyerPaymentDeclared: true }),
    ).toBe("confirm_payment");
    expect(deriveTransactionRoomAction("seller", "paid")).toBe("confirm_fulfillment");
    expect(deriveTransactionRoomAction("buyer", "received")).toBe("rate_transaction");
  });

  it("unlocks contact and route only inside a transaction after intent", () => {
    expect(deriveTransactionRoomAccess(false, "pending")).toEqual({
      contactUnlocked: false,
      routeUnlocked: false,
      qrVerified: false,
    });
    expect(deriveTransactionRoomAccess(true, "pending")).toEqual({
      contactUnlocked: true,
      routeUnlocked: true,
      qrVerified: false,
    });
    expect(deriveTransactionRoomAccess(true, "qr_verified").qrVerified).toBe(true);
  });
});

describe("Omni V1 wallet recharge contracts", () => {
  it("supports explicit retry and timeout paths without treating timeout as decline", () => {
    expect(canTransitionWalletRecharge("pending", "approved")).toBe(true);
    expect(canTransitionWalletRecharge("pending", "timeout")).toBe(true);
    expect(canTransitionWalletRecharge("timeout", "approved")).toBe(true);
    expect(canTransitionWalletRecharge("timeout", "declined")).toBe(true);
    expect(canTransitionWalletRecharge("approved", "pending")).toBe(false);
  });
});
