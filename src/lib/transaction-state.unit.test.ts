import { describe, expect, it } from "vitest";
import { deriveTransactionUiState } from "./transaction-state";

describe("deriveTransactionUiState", () => {
  it("keeps a fresh intent at the offer step and exposes QR generation", () => {
    expect(deriveTransactionUiState("pending", false)).toEqual({
      currentStep: 1,
      canGenerateQr: true,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("waits for the seller after an active QR", () => {
    expect(deriveTransactionUiState("qr_generated", true)).toEqual({
      currentStep: 2,
      canGenerateQr: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("reopens QR generation when the persisted QR has expired", () => {
    expect(deriveTransactionUiState("qr_generated", false)).toEqual({
      currentStep: 1,
      canGenerateQr: true,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("allows the buyer to confirm payment only after seller verification", () => {
    expect(deriveTransactionUiState("payment_pending", false)).toEqual({
      currentStep: 3,
      canGenerateQr: false,
      canConfirmPayment: true,
      canConfirmReceived: false,
    });
  });

  it("allows reception only after payment", () => {
    expect(deriveTransactionUiState("paid", false)).toEqual({
      currentStep: 4,
      canGenerateQr: false,
      canConfirmPayment: false,
      canConfirmReceived: true,
    });
  });

  it("does not expose actions after completion or for unknown states", () => {
    expect(deriveTransactionUiState("completed", false).canConfirmReceived).toBe(false);
    expect(deriveTransactionUiState("unknown", false)).toMatchObject({
      currentStep: 0,
      canGenerateQr: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });
});
