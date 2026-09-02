import type { ReactNode } from "react";
import { ArrowDownToLine, LockKeyhole, WalletCards } from "lucide-react";
import { OmniSectionHeader, OmniStatusBadge } from "./OmniPrimitives";

export type BalanceBucket = {
  bucket: string;
  amount: number;
};

const ALLOCATIONS = [
  {
    key: "pro_credit",
    label: "Pro",
    description: "Allocation interne pour l’abonnement",
  },
  {
    key: "ad_credit",
    label: "Publicité",
    description: "Allocation interne pour les campagnes",
  },
  {
    key: "coupon_credit",
    label: "Coupons",
    description: "Allocation interne pour les offres",
  },
] as const;

export function BalanceSheet({
  balances,
  formatMoney,
  topUpControl,
}: {
  balances: BalanceBucket[];
  formatMoney: (amount: number) => string;
  topUpControl?: ReactNode;
}) {
  const walletBalance = balances.find((item) => item.bucket === "wallet")?.amount ?? 0;
  const allocatedBalance = ALLOCATIONS.reduce(
    (total, allocation) =>
      total + (balances.find((item) => item.bucket === allocation.key)?.amount ?? 0),
    0,
  );

  return (
    <section className="space-y-4" aria-labelledby="balance-sheet-title">
      <OmniSectionHeader
        eyebrow="Omni Wallet"
        title="Un seul portefeuille pour toute la plateforme"
        description="Rechargez votre Omni Wallet, puis allouez son solde à Pro, Publicité ou Coupons."
        action={
          topUpControl ?? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Recharge sécurisée
            </span>
          )
        }
      />

      <article className="omni-card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <WalletCards className="h-4 w-4" />
              Omni Wallet
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">
              {formatMoney(walletBalance)}
            </p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Solde rechargeable et source des usages internes Omni.
            </p>
          </div>
          <OmniStatusBadge tone="positive">Rechargeable</OmniStatusBadge>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Déjà alloué à des usages internes</span>
          <strong>{formatMoney(allocatedBalance)}</strong>
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-3">
        {ALLOCATIONS.map((allocation) => {
          const amount = balances.find((item) => item.bucket === allocation.key)?.amount ?? 0;
          return (
            <article key={allocation.key} className="omni-card min-w-0 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-primary">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <OmniStatusBadge tone="warning">Allocation</OmniStatusBadge>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {allocation.label}
              </p>
              <p className="mt-1 truncate font-display text-xl font-extrabold">
                {formatMoney(amount)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {allocation.description}
              </p>
            </article>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Les paiements clients in-app et les retraits vendeur ne sont pas disponibles dans la V1. Les
        allocations restent contrôlées par Omni et ne sont pas retirables.
      </p>
    </section>
  );
}
