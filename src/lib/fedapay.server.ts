import { query, queryOne } from "./db.server";
import { extendedProUntil, QUALIFYING_AMOUNT } from "./vendor";
import { currentMonthKey } from "./omni";

/** FedaPay REST helpers. Server-only: never imported from client code. */

function apiBase(): string {
  const env = (process.env["FEDAPAY_ENV"] ?? "live").toLowerCase();
  return env === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";
}

function secretKey(): string {
  const key = process.env["FEDAPAY_SECRET_KEY"];
  if (!key) throw new Error("Le paiement n'est pas configuré (FEDAPAY_SECRET_KEY).");
  return key;
}

async function fedapay<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${secretKey()}`,
      "content-type": "application/json",
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    console.error("FedaPay error", response.status, text.slice(0, 500));
    throw new Error("Le prestataire de paiement a refusé la demande.");
  }
  return payload as T;
}

export type DepositRow = {
  id: string;
  facility_id: string;
  amount: number;
  status: string;
  provider_txn_id: string | null;
  checkout_url: string | null;
  created_at: string;
};

/** Creates the FedaPay transaction and returns the hosted checkout URL. */
export async function createFedapayCheckout(input: {
  depositId: string;
  amount: number;
  facilityName: string;
  callbackUrl: string;
  customer: { email: string | null; name: string | null };
}): Promise<{ transactionId: string; url: string }> {
  const [firstname, ...rest] = (input.customer.name ?? "Commerçant").split(" ");
  const created = await fedapay<{ "v1/transaction": { id: number } }>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      description: `Recharge portefeuille OmniView — ${input.facilityName}`,
      amount: input.amount,
      currency: { iso: "XOF" },
      callback_url: input.callbackUrl,
      customer: {
        firstname: firstname || "Commerçant",
        lastname: rest.join(" ") || "OmniView",
        email: input.customer.email ?? undefined,
      },
      custom_metadata: { deposit_id: input.depositId },
    }),
  });

  const transactionId = created["v1/transaction"].id;
  const token = await fedapay<{ token: string; url: string }>(
    `/transactions/${transactionId}/token`,
    { method: "POST", body: "{}" },
  );

  return { transactionId: String(transactionId), url: token.url };
}

/** Reads a transaction back from FedaPay (used to confirm on return). */
export async function fetchFedapayTransaction(
  transactionId: string,
): Promise<{ status: string; amount: number }> {
  const data = await fedapay<{ "v1/transaction": { status: string; amount: number } }>(
    `/transactions/${transactionId}`,
  );
  return data["v1/transaction"];
}

const APPROVED = new Set(["approved", "transferred"]);
const FAILED = new Set(["declined", "canceled", "failed", "expired"]);

export function normaliseStatus(providerStatus: string): "pending" | "approved" | "declined" | "canceled" {
  if (APPROVED.has(providerStatus)) return "approved";
  if (providerStatus === "canceled") return "canceled";
  if (FAILED.has(providerStatus)) return "declined";
  return "pending";
}

/**
 * Credits the wallet exactly once for an approved deposit.
 * Returns true when this call performed the credit.
 */
export async function creditDeposit(
  depositId: string,
  providerStatus: string,
): Promise<boolean> {
  const status = normaliseStatus(providerStatus);
  if (status !== "approved") {
    await query(
      "UPDATE public.wallet_deposits SET status = $1, updated_at = now() WHERE id = $2 AND status = 'pending'",
      [status, depositId],
    );
    return false;
  }

  // Only the first transition out of `pending` credits the wallet.
  const claimed = await queryOne<{ facility_id: string; amount: number }>(
    `UPDATE public.wallet_deposits
     SET status = 'approved', credited_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING facility_id, amount`,
    [depositId],
  );
  if (!claimed) return false;

  const current = await queryOne<{ pro_active_until: string | null }>(
    `INSERT INTO public.subscriptions (facility_id, wallet_balance)
     VALUES ($1, $2)
     ON CONFLICT (facility_id) DO UPDATE
       SET wallet_balance = public.subscriptions.wallet_balance + EXCLUDED.wallet_balance
     RETURNING pro_active_until`,
    [claimed.facility_id, claimed.amount],
  );

  // A qualifying deposit unlocks (or extends) the Pro tier for a month.
  if (claimed.amount >= QUALIFYING_AMOUNT) {
    await query(
      `UPDATE public.subscriptions
       SET tier = 'pro', pro_active_until = $1::date, last_qualifying_action_month = $2
       WHERE facility_id = $3`,
      [extendedProUntil(current?.pro_active_until ?? null), currentMonthKey(), claimed.facility_id],
    );
  }
  return true;
}

/** Verifies the `x-fedapay-signature: t=...,s=...` header over the raw body. */
export async function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
): Promise<boolean> {
  const secret = process.env["FEDAPAY_WEBHOOK_SECRET"];
  if (!secret || !header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((chunk) => {
      const [k, v] = chunk.split("=");
      return [k?.trim() ?? "", v?.trim() ?? ""];
    }),
  ) as { t?: string; s?: string };
  if (!parts.t || !parts.s) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parts.t}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== parts.s.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ parts.s.charCodeAt(i);
  }
  return diff === 0;
}
