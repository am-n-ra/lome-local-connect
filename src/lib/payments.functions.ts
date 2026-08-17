import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { listDeposits, reconcileDeposit, startDeposit } from "./payments.server";
import { enforceRateLimit } from "./rate-limit.server";

export type WalletDeposit = {
  id: string;
  facility_id: string;
  amount: number;
  status: string;
  provider_txn_id: string | null;
  checkout_url: string | null;
  created_at: string;
};

/** Opens a FedaPay checkout (carte bancaire ou mobile money) for a top-up. */
export const createWalletDeposit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        amount: z.number().int().min(500).max(1_000_000),
        idempotencyKey: z
          .string()
          .min(16)
          .max(120)
          .default(() => crypto.randomUUID()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "deposit",
      subject: context.userId,
      limit: 8,
      windowSeconds: 600,
      message: "Trop de tentatives de recharge. Réessayez dans quelques minutes.",
    });
    const origin = new URL(getRequestUrl()).origin;
    return startDeposit({
      userId: context.userId,
      email: context.user.email,
      name: context.user.name,
      facilityId: data.facilityId,
      amount: data.amount,
      idempotencyKey: data.idempotencyKey,
      origin,
    });
  });

/** Confirms a deposit when the buyer comes back from the checkout page. */
export const confirmWalletDeposit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ depositId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => reconcileDeposit(context.userId, data.depositId));

export const getWalletDeposits = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(
    async ({ data, context }) =>
      listDeposits(context.userId, data.facilityId) as Promise<WalletDeposit[]>,
  );
