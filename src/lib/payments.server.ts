import { query, queryOne } from "./db.server";
import { writeAudit } from "./neon-auth.server";
import {
  createFedapayCheckout,
  creditDeposit,
  fetchFedapayTransaction,
  type DepositRow,
} from "./fedapay.server";

async function assertOwner(userId: string, facilityId: string) {
  const row = await queryOne<{ id: string; name: string }>(
    "SELECT id, name FROM public.facilities WHERE id = $1 AND owner_id = $2",
    [facilityId, userId],
  );
  if (!row) throw new Error("Ce commerce ne vous appartient pas.");
  return row;
}

/** Creates a pending deposit and the matching FedaPay hosted checkout. */
export async function startDeposit(input: {
  userId: string;
  email: string | null;
  name: string | null;
  facilityId: string;
  amount: number;
  idempotencyKey: string;
  origin: string;
}): Promise<{ depositId: string; url: string }> {
  const facility = await assertOwner(input.userId, input.facilityId);

  const existing = await queryOne<{ id: string; checkout_url: string | null; status: string }>(
    `SELECT id, checkout_url, status
     FROM public.wallet_deposits
     WHERE facility_id = $1 AND idempotency_key = $2
     ORDER BY created_at DESC LIMIT 1`,
    [input.facilityId, input.idempotencyKey],
  );
  if (existing?.checkout_url && existing.status === "pending") {
    return { depositId: existing.id, url: existing.checkout_url };
  }

  const deposit = await queryOne<{ id: string }>(
    `INSERT INTO public.wallet_deposits (facility_id, user_id, amount, idempotency_key)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [input.facilityId, input.userId, input.amount, input.idempotencyKey],
  );

  const checkout = await createFedapayCheckout({
    depositId: deposit!.id,
    amount: input.amount,
    facilityName: facility.name,
    callbackUrl: `${input.origin}/vendeur?depot=${deposit!.id}`,
    customer: { email: input.email, name: input.name },
  });

  await queryOne(
    `UPDATE public.wallet_deposits
     SET provider_txn_id = $1, checkout_url = $2, normalized_status = 'pending', updated_at = now()
     WHERE id = $3 RETURNING id`,
    [checkout.transactionId, checkout.url, deposit!.id],
  );

  await writeAudit(input.userId, "wallet.deposit.start", "wallet_deposit", deposit!.id, {
    amount: input.amount,
    facilityId: input.facilityId,
  });

  return { depositId: deposit!.id, url: checkout.url };
}

/**
 * Reconciles a deposit on return from the checkout page.
 * The webhook is the source of truth; this makes the UI immediate.
 */
export async function reconcileDeposit(
  userId: string,
  depositId: string,
): Promise<{ status: string; amount: number }> {
  const deposit = await queryOne<DepositRow & { user_id: string }>(
    "SELECT * FROM public.wallet_deposits WHERE id = $1",
    [depositId],
  );
  if (!deposit || deposit.user_id !== userId) throw new Error("Dépôt introuvable.");
  if (deposit.status !== "pending" || !deposit.provider_txn_id) {
    return { status: deposit.status, amount: deposit.amount };
  }

  const remote = await fetchFedapayTransaction(deposit.provider_txn_id);
  await creditDeposit(deposit.id, remote.status);

  const fresh = await queryOne<DepositRow>("SELECT * FROM public.wallet_deposits WHERE id = $1", [
    depositId,
  ]);
  return { status: fresh!.status, amount: fresh!.amount };
}

export async function listDeposits(userId: string, facilityId: string): Promise<DepositRow[]> {
  await assertOwner(userId, facilityId);
  return query<DepositRow>(
    `SELECT id, facility_id, amount, status, provider_txn_id, checkout_url, created_at
     FROM public.wallet_deposits WHERE facility_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [facilityId],
  );
}
