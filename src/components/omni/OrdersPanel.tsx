import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createCheckout, listMyOrders, type BuyerOrder } from "@/lib/checkout.functions";
import {
  confirmCompletion,
  listPendingConfirmations,
  submitReview,
  type PendingConfirmation,
} from "@/lib/reviews.functions";
import { formatFcfa } from "@/lib/omni";
import { useAuth } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente du vendeur",
  confirmed: "Acceptée — à retirer",
  partially_confirmed: "Partiellement acceptée",
  declined: "Refusée",
  expired: "Expirée (sans réponse)",
  completed: "Terminée",
};

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
  const fetchPending = useServerFn(listPendingConfirmations);
  const confirm = useServerFn(confirmCompletion);
  const rate = useServerFn(submitReview);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [pending, setPending] = useState<PendingConfirmation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [o, p] = await Promise.all([fetchOrders({}), fetchPending({})]);
      setOrders(o);
      setPending(p);
    } catch {
      setOrders([]);
      setPending([]);
    }
  }, [fetchOrders, fetchPending, user]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function generate(order: BuyerOrder) {
    setBusy(order.id);
    try {
      await startCheckout({ data: { cartId: order.id } });
      await refresh();
      toast.success("Code de retrait généré. Montrez-le au commerçant.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Génération impossible.");
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Mes demandes</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          {!user && (
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour suivre vos demandes.
            </p>
          )}
          {user && orders.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
          )}
          {orders.map((order) => {
            const active =
              order.qr_token &&
              order.transaction_status === "pending" &&
              (!order.qr_expires_at || new Date(order.qr_expires_at).getTime() > Date.now());
            return (
              <div key={order.id} className="omni-card space-y-3 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display font-bold">{order.facility_name}</p>
                  <Badge variant="outline">{STATUS_LABEL[order.status] ?? order.status}</Badge>
                </div>
                <ul className="space-y-0.5 text-sm text-muted-foreground">
                  {order.items.map((i, index) => (
                    <li key={`${order.id}-${index}`}>
                      {i.quantity} × {i.name} — {formatFcfa(i.price_at_time * i.quantity)}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatFcfa(order.total)}</span>
                </div>

                {order.status === "accepted" && !active && (
                  <Button
                    className="w-full"
                    disabled={busy === order.id}
                    onClick={() => void generate(order)}
                  >
                    {busy === order.id ? "Génération…" : "Générer mon code de retrait"}
                  </Button>
                )}

                {order.status === "accepted" && active && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary p-3">
                    <QRCodeSVG value={order.qr_token!} size={140} level="M" includeMargin />
                    <p className="font-mono text-lg font-bold tracking-widest">{order.qr_token}</p>
                    <p className="text-center text-xs text-muted-foreground">
                      Montrez ce QR au commerçant au moment du retrait. Le paiement se fait sur
                      place (paiement en ligne : mode démo).
                    </p>
                  </div>
                )}

                {order.status === "completed" && (
                  <p className="text-xs text-forest">
                    Achat validé{order.platform_fee !== null ? "" : ""} — merci !
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
