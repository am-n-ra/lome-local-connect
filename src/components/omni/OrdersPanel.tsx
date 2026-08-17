import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  confirmProductReceived,
  confirmTransactionPayment,
  createCheckout,
  createTransactionQr,
  getTransactionTimeline,
  listMyOrders,
  type BuyerOrder,
  type TransactionTimeline,
} from "@/lib/checkout.functions";
import {
  confirmCompletion,
  listPendingConfirmations,
  submitReview,
  type PendingConfirmation,
} from "@/lib/reviews.functions";
import { useMarket } from "@/lib/market";
import { useAuth } from "@/lib/auth";
import { TransactionThreadCard } from "@/components/omni/TransactionThreadCard";

export function OrdersPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { formatMoney } = useMarket();
  const { user } = useAuth();
  const fetchOrders = useServerFn(listMyOrders);
  const startCheckout = useServerFn(createCheckout);
  const startTransactionQr = useServerFn(createTransactionQr);
  const fetchTimeline = useServerFn(getTransactionTimeline);
  const confirmPayment = useServerFn(confirmTransactionPayment);
  const confirmReceived = useServerFn(confirmProductReceived);
  const fetchPending = useServerFn(listPendingConfirmations);
  const confirm = useServerFn(confirmCompletion);
  const rate = useServerFn(submitReview);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [pending, setPending] = useState<PendingConfirmation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, TransactionTimeline>>({});

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [o, p] = await Promise.all([fetchOrders({}), fetchPending({})]);
      setOrders(o);
      setPending(p);
      const timelineEntries = await Promise.all(
        o
          .filter((order) => order.transaction_id)
          .map(async (order) => {
            try {
              return [
                order.transaction_id!,
                await fetchTimeline({ data: { transactionId: order.transaction_id! } }),
              ] as const;
            } catch {
              return null;
            }
          }),
      );
      setTimelines(
        Object.fromEntries(
          timelineEntries.filter((entry): entry is readonly [string, TransactionTimeline] =>
            Boolean(entry),
          ),
        ),
      );
    } catch {
      setOrders([]);
      setPending([]);
    }
  }, [fetchOrders, fetchPending, user]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function generate(order: BuyerOrder) {
    if (!order.transaction_id && order.source !== "cart") return;
    setBusy(order.id);
    try {
      if (order.source === "intent" && order.transaction_id) {
        await startTransactionQr({ data: { transactionId: order.transaction_id } });
      } else {
        await startCheckout({ data: { cartId: order.id } });
      }
      await refresh();
      toast.success("QR transactionnel généré. Montrez-le au commerçant.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Génération impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function transition(txnId: string, action: "payment" | "received") {
    setBusy(txnId);
    try {
      if (action === "payment") await confirmPayment({ data: { transactionId: txnId } });
      else await confirmReceived({ data: { transactionId: txnId } });
      await refresh();
      toast.success(action === "payment" ? "Paiement confirmé." : "Réception confirmée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transition impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmAndRate(txnId: string, rating: number) {
    setBusy(txnId);
    try {
      const target = pending.find((p) => p.transaction_id === txnId);
      if (target && !target.reviewed) {
        await confirm({ data: { transactionId: txnId } }).catch(() => undefined);
      }
      await rate({ data: { transactionId: txnId, rating } });
      await refresh();
      toast.success("Merci pour votre avis !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle>Mes demandes</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 p-4">
            {!user && (
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour suivre vos demandes.
              </p>
            )}

            {user && pending.filter((p) => !p.reviewed).length > 0 && (
              <div className="omni-card space-y-3 p-3">
                <p className="font-display font-bold">À confirmer</p>
                {pending
                  .filter((p) => !p.reviewed)
                  .map((p) => (
                    <div key={p.transaction_id} className="space-y-2 border-t border-border pt-2">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{p.facility_name}</span>
                        <span>{formatMoney(p.amount)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confirmez la transaction et notez le commerçant.
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`Noter ${n} sur 5`}
                            disabled={busy === p.transaction_id}
                            onClick={() => void confirmAndRate(p.transaction_id, n)}
                            className="text-gold transition-transform hover:scale-110"
                          >
                            <Star className="h-6 w-6" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {user && orders.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
            )}
            {orders.map((order) => {
              const timeline = order.transaction_id ? timelines[order.transaction_id] : undefined;
              return (
                <TransactionThreadCard
                  key={order.id}
                  order={order}
                  timeline={timeline}
                  busy={busy === order.id || busy === order.transaction_id}
                  onGenerateQr={() => void generate(order)}
                  onConfirmPayment={() => void transition(order.transaction_id!, "payment")}
                  onConfirmReceived={() => void transition(order.transaction_id!, "received")}
                  onRetry={() => void refresh()}
                />
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
