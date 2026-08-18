import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  confirmProductReceived,
  submitTransactionRating,
  declareTransactionPayment,
  selectTransactionPaymentPreference,
  createCheckout,
  createTransactionQr,
  getTransactionTimeline,
  listMyOrders,
  type BuyerOrder,
  type TransactionTimeline,
} from "@/lib/checkout.functions";
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
  const { user } = useAuth();
  const fetchOrders = useServerFn(listMyOrders);
  const startCheckout = useServerFn(createCheckout);
  const regenerateTransactionQr = useServerFn(createTransactionQr);
  const fetchTimeline = useServerFn(getTransactionTimeline);
  const selectPayment = useServerFn(selectTransactionPaymentPreference);
  const declarePaymentServer = useServerFn(declareTransactionPayment);
  const confirmReceived = useServerFn(confirmProductReceived);
  const submitRatingServer = useServerFn(submitTransactionRating);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, TransactionTimeline>>({});

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const o = await fetchOrders({});
      setOrders(o);
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
    }
  }, [fetchOrders, user]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function createLegacyRoom(order: BuyerOrder) {
    if (order.source !== "cart") return;
    setBusy(order.id);
    try {
      await startCheckout({ data: { cartId: order.id } });
      await refresh();
      toast.success("Room transactionnelle prête. Montrez le QR au commerçant.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ouverture impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateQr(transactionId: string) {
    setBusy(transactionId);
    try {
      await regenerateTransactionQr({ data: { transactionId } });
      await refresh();
      toast.success("Nouveau QR transactionnel généré.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Régénération impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function choosePayment(
    txnId: string,
    method: "cash_on_delivery" | "tmoney" | "flooz" | "external_other",
  ) {
    setBusy(txnId);
    try {
      await selectPayment({ data: { transactionId: txnId, method } });
      await refresh();
      toast.success("Mode de paiement enregistré.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Choix impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function declarePayment(txnId: string) {
    setBusy(txnId);
    try {
      await declarePaymentServer({ data: { transactionId: txnId } });
      await refresh();
      toast.success("Paiement déclaré. Le vendeur doit confirmer la réception.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Déclaration impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmReceivedTransition(txnId: string) {
    setBusy(txnId);
    try {
      await confirmReceived({ data: { transactionId: txnId } });
      await refresh();
      toast.success("Réception confirmée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réception impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function submitRating(txnId: string, rating: number, comment: string) {
    setBusy(txnId);
    try {
      await submitRatingServer({ data: { transactionId: txnId, rating, comment } });
      await refresh();
      toast.success("Merci pour votre avis. Transaction terminée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Avis impossible à publier.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="omni-atlas-surface flex max-h-[min(88dvh,48rem)] w-[min(calc(100vw-1.5rem),34rem)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] p-0 sm:rounded-[1.75rem]"
        >
          <SheetHeader className="border-b border-[var(--atlas-glass-border)] p-4">
            <SheetTitle>Mes demandes</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {!user && (
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour suivre vos demandes.
              </p>
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
                  {...(order.transaction_id
                    ? { onRegenerateQr: () => void regenerateQr(order.transaction_id!) }
                    : {})}
                  {...(order.source === "cart"
                    ? { onCreateRoom: () => void createLegacyRoom(order) }
                    : {})}
                  {...(order.transaction_id
                    ? {
                        onSelectPayment: (method: "cash_on_delivery" | "tmoney" | "flooz" | "external_other") =>
                          void choosePayment(order.transaction_id!, method),
                        onDeclarePayment: () => void declarePayment(order.transaction_id!),
                      }
                    : {})}
                  onConfirmReceived={() => void confirmReceivedTransition(order.transaction_id!)}
                  onSubmitRating={(rating, comment) =>
                    void submitRating(order.transaction_id!, rating, comment)
                  }
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
