export const TRANSACTION_STATUS_LABEL: Record<string, string> = {
  pending: "Offre à confirmer",
  qr_generated: "QR en attente de scan",
  qr_verified: "Vendeur vérifié",
  payment_pending: "Paiement à confirmer",
  paid: "Paiement confirmé",
  fulfillment: "Colis en route",
  received: "Réception confirmée · avis requis",
  rating_pending: "Avis à laisser",
  completed: "Transaction terminée",
  expired: "QR expiré",
  cancelled: "Transaction annulée",
};

export type TransactionUiState = {
  /** Zero-based index consumed by TransactionProgress. */
  currentStep: 0 | 1 | 2 | 3 | 4;
  canGenerateQr: boolean;
  canChoosePayment: boolean;
  canDeclarePayment: boolean;
  /** Kept for seller surfaces that render their own role-specific action. */
  canConfirmPayment: boolean;
  canConfirmReceived: boolean;
};

/**
 * Derive the visible transaction state from persisted status and the current QR/payment context.
 * Buyer payment declaration and seller payment confirmation are deliberately separate actions.
 */
export function deriveTransactionUiState(
  status: string | null | undefined,
  qrActive: boolean,
  paymentPreference?: string | null,
): TransactionUiState {
  const base = {
    canGenerateQr: false,
    canChoosePayment: false,
    canDeclarePayment: false,
    canConfirmPayment: false,
    canConfirmReceived: false,
  } as const;

  if (status === "payment_pending") {
    return {
      ...base,
      currentStep: 3,
      canChoosePayment: !paymentPreference,
      canDeclarePayment: Boolean(paymentPreference),
    };
  }

  if (status === "fulfillment") {
    return {
      ...base,
      currentStep: 4,
      canConfirmReceived: true,
    };
  }

  if (status === "received" || status === "rating_pending") {
    return { ...base, currentStep: 4 };
  }

  if (status === "paid") {
    return { ...base, currentStep: 4 };
  }

  if (status === "completed") {
    return { ...base, currentStep: 4 };
  }

  if (qrActive || status === "qr_verified") {
    return { ...base, currentStep: 2 };
  }

  if (status === "pending" || status === "qr_generated") {
    return { ...base, currentStep: 1, canGenerateQr: true };
  }

  return { ...base, currentStep: 0 };
}
