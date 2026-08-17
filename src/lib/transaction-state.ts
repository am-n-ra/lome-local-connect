export const TRANSACTION_STATUS_LABEL: Record<string, string> = {
  pending: "Offre à confirmer",
  qr_generated: "QR en attente de scan",
  qr_verified: "Vendeur vérifié",
  payment_pending: "Paiement à confirmer",
  paid: "Paiement confirmé",
  fulfillment: "Réception à confirmer",
  completed: "Transaction terminée",
  expired: "QR expiré",
  cancelled: "Transaction annulée",
};

export type TransactionUiState = {
  /** Zero-based index consumed by OmniStepper. */
  currentStep: 0 | 1 | 2 | 3 | 4;
  canGenerateQr: boolean;
  canConfirmPayment: boolean;
  canConfirmReceived: boolean;
};

/**
 * Derive the buyer-visible transaction step from the persisted status.
 * The purchase flow deliberately keeps intent creation separate from QR generation.
 */
export function deriveTransactionUiState(
  status: string | null | undefined,
  qrActive: boolean,
): TransactionUiState {
  if (status === "payment_pending") {
    return {
      currentStep: 3,
      canGenerateQr: false,
      canConfirmPayment: true,
      canConfirmReceived: false,
    };
  }

  if (status === "paid" || status === "fulfillment") {
    return {
      currentStep: 4,
      canGenerateQr: false,
      canConfirmPayment: false,
      canConfirmReceived: true,
    };
  }

  if (status === "completed") {
    return {
      currentStep: 4,
      canGenerateQr: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    };
  }

  if (qrActive || status === "qr_generated" || status === "qr_verified") {
    return {
      currentStep: 2,
      canGenerateQr: false,
      canConfirmPayment: false,
      canConfirmReceived: false,
    };
  }

  if (status === "pending") {
    return {
      currentStep: 1,
      canGenerateQr: true,
      canConfirmPayment: false,
      canConfirmReceived: false,
    };
  }

  return {
    currentStep: 0,
    canGenerateQr: false,
    canConfirmPayment: false,
    canConfirmReceived: false,
  };
}
