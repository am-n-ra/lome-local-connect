import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock3, CreditCard, MessageCircle, QrCode, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ChatPanel } from "@/components/omni/ChatPanel";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente du vendeur",
  confirmed: "Acceptée — à retirer",
  partially_confirmed: "Partiellement acceptée",
  declined: "Refusée",
  expired: "Expirée (sans réponse)",
  completed: "Terminée",
  qr_generated: "QR généré",
  payment_pending: "Paiement à confirmer",
  paid: "Paiement confirmé",
  fulfillment: "Produit à retirer",
};

const EVENT_LABEL: Record<string, string> = {
  intent_created: "Intention créée",
  offer_confirmed: "Offre confirmée",
  qr_generated: "QR généré",
  seller_verified: "Vendeur vérifié",
  payment_pending: "Paiement à confirmer",
  payment_confirmed: "Paiement confirmé",
  product_received: "Produit reçu",
  completed: "Transaction terminée",
  cancelled: "Transaction annulée",
  expired: "QR expiré",
};

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
  const [chatOrder, setChatOrder] = useState<BuyerOrder | null>(null);

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
      toast.success("Code de retrait généré. Montrez-le au commerçant.");
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
              const acceptedStatus =
                order.status === "confirmed" || order.status === "partially_confirmed";
              const active =
                order.qr_token &&
                (order.transaction_status === "pending" ||
                  order.transaction_status === "qr_generated") &&
                (!order.qr_expires_at || new Date(order.qr_expires_at).getTime() > Date.now());
              const canGenerate =
                order.source === "intent"
                  ? order.transaction_status === "pending"
                  : acceptedStatus && !active;
              const timeline = order.transaction_id ? timelines[order.transaction_id] : undefined;
              return (
                <div key={order.id} className="omni-card space-y-3 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold">{order.facility_name}</p>
                    <Badge variant="outline">
                      {STATUS_LABEL[order.transaction_status ?? order.status] ??
                        STATUS_LABEL[order.status] ??
                        order.status}
                    </Badge>
                  </div>
                  <ul className="space-y-0.5 text-sm text-muted-foreground">
                    {order.items.map((i, index) => (
                      <li key={`${order.id}-${index}`}>
                        {i.quantity} × {i.name} — {formatMoney(i.price_at_time * i.quantity)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(order.total)}</span>
                  </div>

                  {order.status === "pending" && (
                    <p className="text-xs text-muted-foreground">
                      Le vendeur a 2 h pour répondre, sinon la demande expire.
                    </p>
                  )}

                  {canGenerate && (
                    <Button
                      className="w-full"
                      disabled={busy === order.id}
                      onClick={() => void generate(order)}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      {busy === order.id
                        ? "Génération…"
                        : order.source === "intent"
                          ? "Confirmer l'offre et générer le QR"
                          : "Générer mon code de retrait"}
                    </Button>
                  )}

                  {active && (
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary p-3">
                      <QRCodeSVG value={order.qr_token!} size={140} level="M" includeMargin />
                      <p className="font-mono text-lg font-bold tracking-widest">
                        {order.qr_token}
                      </p>
                      <p className="text-center text-xs text-muted-foreground">
                        Montrez ce QR au commerçant au moment du retrait. Le paiement se fait sur
                        place (paiement en ligne : mode démo).
                      </p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full" onClick={() => setChatOrder(order)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ouvrir le chat transactionnel
                  </Button>

                  {order.transaction_id && order.transaction_status === "payment_pending" && (
                    <Button
                      className="w-full"
                      disabled={busy === order.transaction_id}
                      onClick={() => void transition(order.transaction_id!, "payment")}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {busy === order.transaction_id ? "Confirmation…" : "Je confirme le paiement"}
                    </Button>
                  )}

                  {order.transaction_id &&
                    (order.transaction_status === "paid" ||
                      order.transaction_status === "fulfillment") && (
                      <Button
                        className="w-full"
                        disabled={busy === order.transaction_id}
                        onClick={() => void transition(order.transaction_id!, "received")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {busy === order.transaction_id
                          ? "Confirmation…"
                          : "Je confirme la réception"}
                      </Button>
                    )}

                  {timeline && timeline.events.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-border p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Clock3 className="h-4 w-4 text-primary" /> Timeline de transaction
                      </p>
                      <ol className="space-y-1.5 text-xs text-muted-foreground">
                        {timeline.events.map((event) => (
                          <li key={event.id} className="flex items-center justify-between gap-2">
                            <span>{EVENT_LABEL[event.event_type] ?? event.event_type}</span>
                            <time dateTime={event.created_at}>
                              {new Date(event.created_at).toLocaleString("fr-FR")}
                            </time>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {order.status === "completed" && (
                    <p className="text-xs text-forest">Achat validé — merci !</p>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      <ChatPanel
        open={Boolean(chatOrder)}
        onOpenChange={(open) => {
          if (!open) setChatOrder(null);
        }}
        facilityId={chatOrder?.facility_id}
        facilityName={chatOrder?.facility_name}
        transactionContext={
          chatOrder
            ? {
                status:
                  STATUS_LABEL[chatOrder.transaction_status ?? chatOrder.status] ??
                  chatOrder.status,
                amountLabel: formatMoney(chatOrder.total),
                qrCode: chatOrder.qr_token,
              }
            : undefined
        }
      />
    </>
  );
}
