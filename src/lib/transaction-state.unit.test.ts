import { describe, expect, it } from "vitest";
import { deriveTransactionUiState } from "./transaction-state";

describe("deriveTransactionUiState", () => {
  it("keeps a fresh intent at the offer step and exposes QR generation", () => {
    expect(deriveTransactionUiState("pending", false)).toEqual({
      currentStep: 1,
      canGenerateQr: true,
      canChoosePayment: false,
      canDeclarePayment: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("waits for the seller after an active QR", () => {
    expect(deriveTransactionUiState("qr_generated", true)).toEqual({
      currentStep: 2,
      canGenerateQr: false,
      canChoosePayment: false,
      canDeclarePayment: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("reopens QR generation when the persisted QR has expired", () => {
    expect(deriveTransactionUiState("qr_generated", false)).toEqual({
      currentStep: 1,
      canGenerateQr: true,
      canChoosePayment: false,
      canDeclarePayment: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("requires a payment choice before the buyer can declare payment", () => {
    expect(deriveTransactionUiState("payment_pending", false, null)).toMatchObject({
      currentStep: 3,
      canChoosePayment: true,
      canDeclarePayment: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
    expect(deriveTransactionUiState("payment_pending", false, "tmoney")).toMatchObject({
      currentStep: 3,
      canChoosePayment: false,
      canDeclarePayment: true,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });

  it("allows reception only after seller starts fulfillment", () => {
    expect(deriveTransactionUiState("paid", false)).toMatchObject({
      currentStep: 4,
      canConfirmReceived: false,
    });
    expect(deriveTransactionUiState("fulfillment", false)).toMatchObject({
      currentStep: 4,
      canConfirmReceived: true,
    });
  });

  it("moves from reception to the mandatory rating state without reopening receipt", () => {
    expect(deriveTransactionUiState("received", false)).toMatchObject({
      currentStep: 4,
      canConfirmReceived: false,
    });
    expect(deriveTransactionUiState("rating_pending", false)).toMatchObject({
      currentStep: 4,
      canConfirmReceived: false,
    });
  });

  it("does not expose actions after completion or for unknown states", () => {
    expect(deriveTransactionUiState("completed", false).canConfirmReceived).toBe(false);
    expect(deriveTransactionUiState("unknown", false)).toMatchObject({
      currentStep: 0,
      canGenerateQr: false,
      canChoosePayment: false,
      canDeclarePayment: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    });
  });
});
