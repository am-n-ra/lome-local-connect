import type { ReactNode } from "react";
import { ArrowDownToLine, LockKeyhole, WalletCards } from "lucide-react";
import { OmniSectionHeader, OmniStatusBadge } from "./OmniPrimitives";

export type BalanceBucket = {
  bucket: string;
  amount: number;
};

const BUCKETS = [
  {
    key: "wallet",
    label: "Wallet",
    description: "Rechargeable via FedaPay",
    tone: "positive" as const,
    withdrawable: true,
  },
  {
    key: "payout",
    label: "Payout",
    description: "Revenus issus des transactions",
    tone: "positive" as const,
    withdrawable: true,
  },
  {
    key: "ad_credit",
    label: "Publicité",
    description: "Crédit réservé aux campagnes",
    tone: "warning" as const,
    withdrawable: false,
  },
  {
    key: "coupon_credit",
    label: "Coupons",
    description: "Crédit réservé aux offres",
    tone: "warning" as const,
    withdrawable: false,
  },
  {
    key: "pro_credit",
    label: "Pro",
    description: "Crédit non monétaire de plan",
    tone: "warning" as const,
    withdrawable: false,
  },
];

export function BalanceSheet({
  balances,
  formatMoney,
  topUpControl,
}: {
  balances: BalanceBucket[];
  formatMoney: (amount: number) => string;
  topUpControl?: ReactNode;
}) {
  return (
    <section className="space-y-4" aria-labelledby="balance-sheet-title">
      <OmniSectionHeader
        eyebrow="Compte financier"
        title="Solde opérationnel"
        description="Chaque bucket a un usage distinct. Les crédits non monétaires ne sont jamais retirables."
        action={
          topUpControl ?? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Recharge sécurisée
            </span>
          )
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BUCKETS.map((definition) => {
          const balance = balances.find((item) => item.bucket === definition.key)?.amount ?? 0;
          return (
            <article key={definition.key} className="omni-card min-w-0 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-primary">
                  <WalletCards className="h-4 w-4" />
                </div>
                <OmniStatusBadge tone={definition.tone}>
                  {definition.withdrawable ? "Retirable" : "Dédié"}
                </OmniStatusBadge>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {definition.label}
              </p>
              <p className="mt-1 truncate font-display text-xl font-extrabold">
                {formatMoney(balance)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {definition.description}
              </p>
              {!definition.withdrawable ? (
                <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <LockKeyhole className="h-3 w-3" />
                  Usage contrôlé par Omni
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
