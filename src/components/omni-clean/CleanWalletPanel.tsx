import { CreditCard, LockKeyhole, WalletCards } from "lucide-react";
import type { VendorBalance } from "@/lib/vendor.functions";
import type { WalletAllocationBucket } from "@/lib/wallet.functions";

type Props = {
  balances: VendorBalance[];
  formatMoney: (amount: number) => string;
  topUpAmount: string;
  topUpBusy: boolean;
  allocationBucket: WalletAllocationBucket;
  allocationAmount: string;
  allocationBusy: boolean;
  onTopUpAmountChange: (value: string) => void;
  onTopUp: () => void;
  onAllocationBucketChange: (value: WalletAllocationBucket) => void;
  onAllocationAmountChange: (value: string) => void;
  onAllocate: () => void;
};

const bucketLabel: Record<string, string> = { pro_credit: "Pro", ad_credit: "Publicité", coupon_credit: "Coupons" };

export function CleanWalletPanel({ balances, formatMoney, topUpAmount, topUpBusy, allocationBucket, allocationAmount, allocationBusy, onTopUpAmountChange, onTopUp, onAllocationBucketChange, onAllocationAmountChange, onAllocate }: Props) {
  const wallet = balances.find((balance) => balance.bucket === "wallet")?.amount ?? 0;
  const internal = balances.filter((balance) => balance.bucket !== "wallet");
  return (
    <div className="space-y-4">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Omni Wallet</p><h2 className="mt-1 font-display text-2xl font-extrabold">Un seul portefeuille rechargeable</h2><p className="mt-1 text-sm leading-6 text-[var(--omni-ink-muted)]">Rechargez ici pour utiliser les services Omni. Les paiements buyer-vendeur restent externes et il n’y a pas de retrait seller en V1.</p></div>
      <div className="rounded-[1.4rem] bg-[var(--omni-orange)] p-5 text-white"><div className="flex items-center justify-between"><WalletCards className="h-5 w-5" /><LockKeyhole className="h-4 w-4 opacity-80" /></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] opacity-80">Solde disponible</p><p className="mt-1 font-display text-3xl font-extrabold">{formatMoney(wallet)}</p></div>
      <div className="grid gap-2 sm:grid-cols-3">{internal.map((balance) => <div key={balance.bucket} className="rounded-2xl bg-[var(--omni-paper)] p-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--omni-ink-muted)]">{bucketLabel[balance.bucket] ?? balance.bucket}</p><p className="mt-1 font-display text-lg font-extrabold">{formatMoney(balance.amount)}</p><p className="mt-1 text-[10px] font-semibold text-[var(--omni-ink-muted)]">Utilisable sur Omni</p></div>)}</div>
      <div className="rounded-[1.35rem] border border-black/5 bg-white/70 p-4"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-[var(--omni-orange)]" /><p className="font-extrabold">Recharger via FedaPay</p></div><div className="mt-3 flex flex-wrap gap-2"><input className="omni-clean-field min-w-32 flex-1" inputMode="numeric" type="number" min="500" value={topUpAmount} onChange={(event) => onTopUpAmountChange(event.target.value.replace(/\D/g, ""))} aria-label="Montant à recharger en FCFA" /><button type="button" onClick={onTopUp} disabled={topUpBusy} className="omni-clean-primary-button min-h-12">{topUpBusy ? "Ouverture…" : "Payer par carte"}</button></div><p className="mt-2 text-xs font-semibold text-[var(--omni-ink-muted)]">FedaPay ouvre un checkout sécurisé. Le serveur confirmera la recharge avant de créditer le wallet.</p></div>
      <div className="rounded-[1.35rem] border border-black/5 bg-white/70 p-4"><p className="font-extrabold">Allouer pour une fonctionnalité</p><p className="mt-1 text-xs leading-5 text-[var(--omni-ink-muted)]">Ces buckets internes ne sont pas des retraits et ne quittent pas Omni.</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_auto]"><select className="omni-clean-field" value={allocationBucket} onChange={(event) => onAllocationBucketChange(event.target.value as WalletAllocationBucket)}><option value="pro_credit">Pro</option><option value="ad_credit">Publicité</option><option value="coupon_credit">Coupons</option></select><input className="omni-clean-field" inputMode="numeric" type="number" min="1" value={allocationAmount} onChange={(event) => onAllocationAmountChange(event.target.value.replace(/\D/g, ""))} aria-label="Montant à allouer" /><button type="button" onClick={onAllocate} disabled={allocationBusy} className="omni-clean-secondary-button min-h-12">{allocationBusy ? "Allocation…" : "Allouer"}</button></div></div>
    </div>
  );
}
