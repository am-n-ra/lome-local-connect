import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@/lib/useServerFn";
import { useAuth } from "@/lib/auth";
import {
  confirmProductReceived,
  createTransactionQr,
  declareTransactionPayment,
  getTransactionTimeline,
  selectTransactionPaymentPreference,
  submitTransactionRating,
  type BuyerOrder,
  type TransactionTimeline,
} from "@/lib/checkout.functions";
import type { PaymentPreferenceMethod } from "@/lib/omni-v1-contracts";
import { TransactionThreadCard } from "@/components/omni/TransactionThreadCard";

export type CleanTransactionContext = {
  transactionId: string;
  facilityId: string;
  facilityName: string;
  amount: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: CleanTransactionContext | null;
};

function toBuyerOrder(timeline: TransactionTimeline): BuyerOrder {
  const transaction = timeline.transaction;
  return {
    id: transaction.id,
    source: "intent",
    facility_id: transaction.facility_id,
    facility_name: transaction.facility_name,
    status: transaction.status,
    created_at: transaction.intent_created_at ?? new Date().toISOString(),
    total: transaction.amount,
    items: [{ name: "Intention d’achat", quantity: 1, price_at_time: transaction.amount }],
    qr_token: transaction.qr_token,
    qr_expires_at: transaction.qr_expires_at,
    transaction_id: transaction.id,
    transaction_status: transaction.status,
    intent_created_at: transaction.intent_created_at,
    payment_mode: transaction.payment_mode,
    amount: transaction.amount,
    platform_fee: null,
  };
}

export function CleanTransactionRoom({ open, onOpenChange, context }: Props) {
  const { user } = useAuth();
  const fetchTimeline = useServerFn(getTransactionTimeline);
  const regenerateQr = useServerFn(createTransactionQr);
  const selectPayment = useServerFn(selectTransactionPaymentPreference);
  const declarePayment = useServerFn(declareTransactionPayment);
  const confirmReceived = useServerFn(confirmProductReceived);
  const submitRating = useServerFn(submitTransactionRating);
  const [timeline, setTimeline] = useState<TransactionTimeline | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!context?.transactionId) return;
    try {
      setTimeline(await fetchTimeline({ data: { transactionId: context.transactionId } }));
    } catch {
      setTimeline(null);
    }
  }, [context?.transactionId, fetchTimeline]);

  useEffect(() => {
    if (!open || !context?.transactionId || !user) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(timer);
  }, [context?.transactionId, open, refresh, user]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action transactionnelle impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !context) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[rgba(30,28,26,.26)] p-0 backdrop-blur-[3px] sm:items-center sm:p-4" role="presentation">
      <section className="omni-clean-transaction-room flex max-h-[min(94dvh,54rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]" role="dialog" aria-modal="true" aria-labelledby="clean-transaction-title">
        <header className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Transaction Omni</p><h2 id="clean-transaction-title" className="mt-1 truncate font-display text-2xl font-extrabold tracking-[-0.04em]">{context.facilityName}</h2><p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">Intention → Offre → QR → Paiement → Réception</p></div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer la transaction" className="omni-clean-icon-button h-11 w-11"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {!timeline ? <div className="rounded-2xl bg-[var(--omni-paper)] p-5 text-sm font-semibold text-[var(--omni-ink-muted)]">Chargement du fil transactionnel…</div> : <div className="clean-transaction-card"><TransactionThreadCard order={toBuyerOrder(timeline)} timeline={timeline} busy={busy} onRegenerateQr={() => void run(() => regenerateQr({ data: { transactionId: timeline.transaction.id } }))} onSelectPayment={(method: PaymentPreferenceMethod) => void run(() => selectPayment({ data: { transactionId: timeline.transaction.id, method } }))} onDeclarePayment={() => void run(() => declarePayment({ data: { transactionId: timeline.transaction.id } }))} onConfirmReceived={() => void run(() => confirmReceived({ data: { transactionId: timeline.transaction.id } }))} onSubmitRating={(rating, comment) => void run(() => submitRating({ data: { transactionId: timeline.transaction.id, rating, comment } }))} onRetry={() => void refresh()} /></div>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-black/5 px-5 py-3 text-xs font-semibold text-[var(--omni-ink-muted)] sm:px-6"><span><Check className="mr-1 inline h-3.5 w-3.5 text-[var(--omni-success)]" />Paiement vendeur externe à Omni</span><span className="font-mono">{context.transactionId.slice(0, 8)}</span></footer>
      </section>
    </div>
  );
}
