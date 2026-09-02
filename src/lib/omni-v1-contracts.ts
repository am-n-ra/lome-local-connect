export const FACILITY_STATES = [
  "unclaimed",
  "claimed",
  "certified",
  "confirmed",
  "suspended",
] as const;

export type FacilityState = (typeof FACILITY_STATES)[number];

export type LocationAccuracyBand = "precise" | "approximate" | "unknown";

export function classifyLocationAccuracy(
  accuracy: number | null | undefined,
  thresholdMeters = 500,
): LocationAccuracyBand {
  if (!Number.isFinite(accuracy) || (accuracy as number) <= 0) return "unknown";
  return (accuracy as number) <= thresholdMeters ? "precise" : "approximate";
}

export function canRenderPersonalLocationMarker(
  hasFreshBrowserCallback: boolean,
  accuracy: number | null | undefined,
  thresholdMeters = 500,
): boolean {
  return (
    hasFreshBrowserCallback && classifyLocationAccuracy(accuracy, thresholdMeters) === "precise"
  );
}

export const AVAILABILITY_STATUSES = [
  "sent",
  "awaiting_seller",
  "available",
  "partial",
  "unavailable",
  "sla_expired",
  "closed_no_purchase",
] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type AvailabilityMode = "single" | "bulk";
export type AvailabilityPanelMode = "bulk" | "manual";
export type AvailabilityPanelScope = "facility" | "visible";

export function deriveAvailabilityPanelScope(mode: AvailabilityPanelMode): AvailabilityPanelScope {
  return mode === "manual" ? "facility" : "visible";
}

// Pro bulk has no monthly credit decrement; keep a bounded per-request cap
// for payload and provider safety while allowing the full visible result set.
export const MAX_AVAILABILITY_TARGETS = 240;

export type BuyerAvailabilityInput = {
  productQuery: string;
  quantity: number;
  facilityIds: string[];
  maxBudgetFcfa?: number;
};

/** Seller-facing payload deliberately excludes the buyer's private budget. */
export type SellerAvailabilityPayload = {
  productQuery: string;
  quantity: number;
  facilityId: string;
};

export type AvailabilityValidation =
  | { ok: true; mode: AvailabilityMode; targetCount: number }
  | { ok: false; reason: "empty_product" | "invalid_quantity" | "no_targets" | "too_many_targets" };

export function validateAvailabilityInput(input: BuyerAvailabilityInput): AvailabilityValidation {
  const productQuery = input.productQuery.trim();
  if (!productQuery) return { ok: false, reason: "empty_product" };
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return { ok: false, reason: "invalid_quantity" };
  }
  const targetCount = new Set(input.facilityIds.filter(Boolean)).size;
  if (targetCount === 0) return { ok: false, reason: "no_targets" };
  if (targetCount > MAX_AVAILABILITY_TARGETS) {
    return { ok: false, reason: "too_many_targets" };
  }
  return {
    ok: true,
    mode: targetCount === 1 ? "single" : "bulk",
    targetCount,
  };
}

export function toSellerAvailabilityPayload(
  input: BuyerAvailabilityInput,
  facilityId: string,
): SellerAvailabilityPayload {
  const validation = validateAvailabilityInput({ ...input, facilityIds: [facilityId] });
  if (!validation.ok) throw new Error(`Invalid availability request: ${validation.reason}`);
  return {
    productQuery: input.productQuery.trim(),
    quantity: input.quantity,
    facilityId,
  };
}

export type AvailabilityResponseAction = "available" | "partial" | "unavailable";

export function canSubmitAvailabilityResponse(status: AvailabilityStatus): boolean {
  return status === "sent" || status === "awaiting_seller";
}

export const TRANSACTION_STATUSES = [
  "pending",
  "qr_generated",
  "qr_verified",
  "payment_pending",
  "paid",
  "fulfillment",
  "received",
  "rating_pending",
  "completed",
  "expired",
  "cancelled",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type TransactionRole = "buyer" | "seller";

const TRANSACTION_TRANSITIONS: Record<TransactionStatus, readonly TransactionStatus[]> = {
  pending: ["qr_generated", "cancelled"],
  qr_generated: ["qr_verified", "expired", "cancelled"],
  qr_verified: ["payment_pending", "cancelled"],
  payment_pending: ["paid", "cancelled"],
  paid: ["fulfillment"],
  fulfillment: ["received", "rating_pending"],
  received: ["rating_pending"],
  rating_pending: ["completed"],
  completed: [],
  expired: ["qr_generated", "cancelled"],
  cancelled: [],
};

export function canTransitionTransaction(from: TransactionStatus, to: TransactionStatus): boolean {
  return TRANSACTION_TRANSITIONS[from].includes(to);
}

export type TransactionEventType =
  | "intent_created"
  | "offer_confirmed"
  | "coupon_applied"
  | "qr_generated"
  | "seller_verified"
  | "payment_preference_selected"
  | "payment_declared"
  | "payment_recorded"
  | "payment_confirmed"
  | "fulfillment_started"
  | "received_confirmed"
  | "rating_submitted"
  | "completed"
  | "error";

export type TransactionActionId =
  | "regenerate_qr"
  | "verify_qr"
  | "choose_payment"
  | "declare_paid"
  | "confirm_payment"
  | "confirm_fulfillment"
  | "confirm_received"
  | "rate_transaction";

export type TransactionPrimaryAction = {
  id: TransactionActionId;
  label: string;
};

export function deriveTransactionPrimaryAction(
  role: TransactionRole,
  status: TransactionStatus,
  paymentDeclared = false,
): TransactionPrimaryAction | null {
  if (role === "buyer") {
    // New intents generate the QR atomically. A legacy pending record can only
    // expose the bounded recovery action; it must not add a second offer step.
    if (status === "pending") return { id: "regenerate_qr", label: "Générer le QR" };
    if (status === "expired") return { id: "regenerate_qr", label: "Générer un nouveau QR" };
    if (status === "qr_verified") return { id: "choose_payment", label: "Choisir le paiement" };
    if (status === "payment_pending" && !paymentDeclared) {
      return { id: "declare_paid", label: "J’ai payé" };
    }
    if (status === "fulfillment") {
      return { id: "confirm_received", label: "Je confirme la réception" };
    }
    if (status === "received" || status === "rating_pending") {
      return { id: "rate_transaction", label: "Noter la transaction" };
    }
    return null;
  }

  if (status === "qr_generated") return { id: "verify_qr", label: "Scanner le QR" };
  if (status === "payment_pending" && paymentDeclared) {
    return { id: "confirm_payment", label: "Confirmer l’encaissement" };
  }
  if (status === "paid") return { id: "confirm_fulfillment", label: "Confirmer la remise" };
  return null;
}

export type PaymentPreferenceMethod = "cash_on_delivery" | "tmoney" | "flooz" | "external_other";

export type PaymentPreference = {
  method: PaymentPreferenceMethod;
  remote: boolean;
  sellerContactDisclosure: "none" | "after_qr_verified";
};

export function paymentPreference(method: PaymentPreferenceMethod): PaymentPreference {
  const remote = method !== "cash_on_delivery";
  return {
    method,
    remote,
    sellerContactDisclosure: remote ? "after_qr_verified" : "none",
  };
}

export type TransactionRoomStatus = TransactionStatus | "received" | "rating_pending";

export type TransactionRoomAction =
  | "present_qr"
  | "verify_qr"
  | "choose_payment"
  | "declare_paid"
  | "confirm_payment"
  | "confirm_fulfillment"
  | "confirm_received"
  | "rate_transaction";

export type TransactionRoomPaymentChoice = "cash" | "mobile_money" | "pay_on_delivery";

export type TransactionRoomSnapshot = {
  transactionId: string;
  role: TransactionRole;
  status: TransactionRoomStatus;
  hasIntent: boolean;
  nextAction: TransactionRoomAction | null;
  qrVisible: boolean;
  qrVerified: boolean;
  contactUnlocked: boolean;
  routeUnlocked: boolean;
  amountDue: number | null;
  discountAmount: number | null;
  paymentChoice: TransactionRoomPaymentChoice | null;
  buyerPaymentDeclared: boolean;
  sellerPaymentConfirmed: boolean;
};

/**
 * The transaction room is resumable and role-specific. It never changes map
 * presentation; it only derives the next operation above the existing scene.
 */
export function deriveTransactionRoomAction(
  role: TransactionRole,
  status: TransactionRoomStatus,
  options: {
    hasQr?: boolean;
    paymentChoice?: TransactionRoomPaymentChoice | null;
    buyerPaymentDeclared?: boolean;
  } = {},
): TransactionRoomAction | null {
  const hasQr = Boolean(options.hasQr);
  const paymentChoice = options.paymentChoice ?? null;
  const buyerPaymentDeclared = Boolean(options.buyerPaymentDeclared);

  if (role === "buyer") {
    if ((status === "pending" || status === "qr_generated") && hasQr) return "present_qr";
    if (status === "qr_verified" && !paymentChoice) return "choose_payment";
    if (
      status === "payment_pending" &&
      paymentChoice &&
      paymentChoice !== "pay_on_delivery" &&
      !buyerPaymentDeclared
    ) {
      return "declare_paid";
    }
    if (status === "fulfillment") return "confirm_received";
    if (status === "received" || status === "rating_pending") return "rate_transaction";
    return null;
  }

  if (status === "qr_generated" && hasQr) return "verify_qr";
  if (status === "payment_pending" && buyerPaymentDeclared) return "confirm_payment";
  if (status === "paid") return "confirm_fulfillment";
  return null;
}

export function deriveTransactionRoomAccess(
  hasIntent: boolean,
  status: TransactionRoomStatus,
): Pick<TransactionRoomSnapshot, "contactUnlocked" | "routeUnlocked" | "qrVerified"> {
  const qrVerified =
    status === "qr_verified" ||
    status === "payment_pending" ||
    status === "paid" ||
    status === "fulfillment" ||
    status === "received" ||
    status === "rating_pending" ||
    status === "completed";
  return {
    // Contact and route are transaction-only data: they appear after intent,
    // never on a facility/result card before the buyer commits.
    contactUnlocked: hasIntent,
    routeUnlocked: hasIntent,
    qrVerified,
  };
}

export type WalletBucket = "wallet" | "payout" | "ad_credit" | "coupon_credit" | "pro_credit";
export type WalletAllocationAction = "allocate" | "consume";
export type WalletRechargeStatus = "pending" | "approved" | "declined" | "canceled" | "timeout";

const WALLET_RECHARGE_TRANSITIONS: Record<WalletRechargeStatus, readonly WalletRechargeStatus[]> = {
  pending: ["approved", "declined", "canceled", "timeout"],
  approved: [],
  declined: ["pending"],
  canceled: ["pending"],
  timeout: ["pending", "approved", "declined"],
};

export function canTransitionWalletRecharge(
  from: WalletRechargeStatus,
  to: WalletRechargeStatus,
): boolean {
  return WALLET_RECHARGE_TRANSITIONS[from].includes(to);
}

export const ONBOARDING_STEPS = [
  "welcome",
  "location",
  "interests",
  "identity",
  "facility_placement",
  "category",
  "first_product",
  "hours",
  "preview",
  "completed",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type NotificationTarget =
  | { kind: "availability"; requestId: string }
  | { kind: "transaction"; transactionId: string }
  | { kind: "qr"; token: string }
  | { kind: "wallet"; rechargeId: string };

export function buildTransactionLink(origin: string, token: string): string {
  const url = new URL("/transaction/qr", origin);
  url.searchParams.set("token", token);
  return url.toString();
}
