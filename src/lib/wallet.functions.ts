import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";
import {
  ensureWalletAccount,
  listWalletBalances,
  transferWalletBuckets,
  type WalletBalance,
} from "./wallet.server";

const allocationBucket = z.enum(["ad_credit", "coupon_credit", "pro_credit"]);

export type WalletAllocationBucket = z.infer<typeof allocationBucket>;
export type WalletAllocationBalance = { bucket: string; availableAmount: number };

export const transferWalletAllocation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        bucket: allocationBucket,
        amount: z.number().int().min(1).max(100_000_000),
        idempotencyKey: z.string().min(16).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ balances: WalletAllocationBalance[] }> => {
    await enforceRateLimit({
      bucket: "wallet_transfer",
      subject: context.userId,
      limit: 20,
      windowSeconds: 600,
      message: "Trop d’allocations wallet. Réessayez dans quelques minutes.",
    });

    const owned = await queryOne<{ id: string }>(
      "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
      [data.facilityId, context.userId],
    );
    if (!owned) throw new Error("Ce commerce ne vous appartient pas.");

    const accountId = await ensureWalletAccount({ facilityId: data.facilityId });
    await transferWalletBuckets({
      accountId,
      fromBucket: "wallet",
      toBucket: data.bucket,
      amount: data.amount,
      idempotencyKey: data.idempotencyKey ?? crypto.randomUUID(),
      actorUserId: context.userId,
      source: "seller_wallet_allocation",
      metadata: { facility_id: data.facilityId, bucket: data.bucket },
    });

    return { balances: await listWalletBalances(accountId) };
  });
