import { query, queryOne } from "./db.server";

export const WALLET_BUCKETS = [
  "wallet",
  "payout",
  "ad_credit",
  "coupon_credit",
  "pro_credit",
] as const;

export type WalletBucket = (typeof WALLET_BUCKETS)[number];

export type WalletBalance = {
  bucket: WalletBucket;
  currency: "XOF";
  availableAmount: number;
  reservedAmount: number;
};

export type WalletOwner = { userId: string } | { facilityId: string };

export async function ensureWalletAccount(owner: WalletOwner): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `SELECT public.omni_ensure_wallet_account($1, $2::uuid, 'XOF') AS id`,
    ["userId" in owner ? owner.userId : null, "facilityId" in owner ? owner.facilityId : null],
  );
  if (!row?.id) throw new Error("Impossible de créer le compte wallet.");
  return row.id;
}

export async function appendWalletEntry(input: {
  accountId: string;
  bucket: WalletBucket;
  amount: number;
  referenceType: string;
  referenceId?: string | null;
  idempotencyKey: string;
  actorUserId?: string | null;
  source?: string;
  metadata?: Record<string, string | number | boolean | null>;
  availableAt?: Date;
}): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `SELECT public.omni_append_wallet_entry(
      $1::uuid, $2, $3::bigint, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz
    ) AS id`,
    [
      input.accountId,
      input.bucket,
      input.amount,
      input.referenceType,
      input.referenceId ?? null,
      input.idempotencyKey,
      input.actorUserId ?? null,
      input.source ?? "system",
      JSON.stringify(input.metadata ?? {}),
      input.availableAt ?? new Date(),
    ],
  );
  if (!row?.id) throw new Error("Impossible d’enregistrer l’écriture wallet.");
  return row.id;
}

export async function transferWalletBuckets(input: {
  accountId: string;
  fromBucket: WalletBucket;
  toBucket: WalletBucket;
  amount: number;
  idempotencyKey: string;
  actorUserId?: string | null;
  source?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `SELECT public.omni_transfer_wallet_buckets(
      $1::uuid, $2, $3, $4::bigint, $5, $6, $7, $8::jsonb
    ) AS id`,
    [
      input.accountId,
      input.fromBucket,
      input.toBucket,
      input.amount,
      input.idempotencyKey,
      input.actorUserId ?? null,
      input.source ?? "system",
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  if (!row?.id) throw new Error("Impossible d’effectuer le transfert wallet.");
  return row.id;
}

export async function listWalletBalances(accountId: string): Promise<WalletBalance[]> {
  return query<WalletBalance>(
    `SELECT bucket,
            currency,
            available_amount::int AS "availableAmount",
            reserved_amount::int AS "reservedAmount"
     FROM public.wallet_balance_snapshots
     WHERE account_id = $1::uuid
     ORDER BY CASE bucket
       WHEN 'wallet' THEN 1
       WHEN 'payout' THEN 2
       WHEN 'ad_credit' THEN 3
       WHEN 'coupon_credit' THEN 4
       WHEN 'pro_credit' THEN 5
       ELSE 99 END`,
    [accountId],
  );
}

export async function rebuildWalletBalances(accountId: string): Promise<void> {
  for (const bucket of WALLET_BUCKETS) {
    await query(`SELECT public.omni_rebuild_wallet_snapshot($1::uuid, $2)`, [accountId, bucket]);
  }
}
