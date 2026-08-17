import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, CheckCircle2, Clock3, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OmniStepper } from "@/components/omni/ui/OmniPrimitives";
import { TransactionMessageThread } from "@/components/omni/TransactionMessageThread";
import type { BuyerOrder, TransactionEvent, TransactionTimeline } from "@/lib/checkout.functions";
import { deriveTransactionUiState, TRANSACTION_STATUS_LABEL } from "@/lib/transaction-state";
import { TRANSACTION_PROGRESS_LABELS } from "@/lib/transaction-progress";

const EVENT_LABEL: Record<string, string> = {
  intent_created: "Intention créée",
  offer_confirmed: "Offre confirmée",
  coupon_applied: "Coupon appliqué",
  qr_generated: "QR généré",
  seller_verified: "Vendeur vérifié",
  payment_pending: "Paiement à confirmer",
  payment_confirmed: "Paiement confirmé",
  product_received: "Produit reçu",
  completed: "Transaction terminée",
  cancelled: "Transaction annulée",
  expired: "QR expiré",
};

const ERROR_EVENTS = new Set(["cancelled", "expired", "payment_failed", "coupon_rejected"]);

export function TransactionThreadCard({
  order,
  timeline,
  busy,
  onGenerateQr,
  onConfirmPayment,
  onConfirmReceived,
  onRetry,
}: {
  order: BuyerOrder;
  timeline?: TransactionTimeline | undefined;
  busy: boolean;
  onGenerateQr: () => void;
  onConfirmPayment: () => void;
  onConfirmReceived: () => void;
  onRetry?: () => void;
}) {
  const transaction = timeline?.transaction;
  const qrToken = order.qr_token ?? transaction?.qr_token ?? null;
  const qrExpiry = order.qr_expires_at ?? transaction?.qr_expires_at ?? null;
  const qrActive = Boolean(qrToken && (!qrExpiry || new Date(qrExpiry).getTime() > Date.now()));
  const currentStatus = order.transaction_status ?? order.status;
  const accepted = order.status === "confirmed" || order.status === "partially_confirmed";
  const uiState = deriveTransactionUiState(currentStatus, qrActive);
  const canGenerate =
    order.source === "intent"
      ? uiState.canGenerateQr
      : accepted && !qrActive && currentStatus !== "completed";
  const paymentPending = uiState.canConfirmPayment;
  const canConfirmReceived = uiState.canConfirmReceived;
  const events = timeline?.events ?? [];
  const progress = uiState.currentStep;

  return (
    <div className="omni-card space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{order.facility_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}
          </p>
        </div>
        <Badge variant="outline">{TRANSACTION_STATUS_LABEL[currentStatus] ?? currentStatus}</Badge>
      </div>

      <OmniStepper steps={[...TRANSACTION_PROGRESS_LABELS]} current={progress} />

      <div className="flex items-center justify-between border-y border-border py-3 text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-display text-lg font-bold">
          {order.total.toLocaleString("fr-FR")} F
        </span>
      </div>

      {canGenerate ? (
        <Button className="w-full" disabled={busy} onClick={onGenerateQr}>
          <QrCode className="mr-2 h-4 w-4" />
          {busy ? "Génération…" : "Confirmer l’offre et générer le QR"}
        </Button>
      ) : null}

      {qrToken && qrActive ? (
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <QRCodeSVG value={qrToken} size={156} level="M" includeMargin />
          <p className="mt-2 font-mono text-lg font-bold tracking-widest">{qrToken}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {qrExpiry
              ? `Valide jusqu'à ${new Date(qrExpiry).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : "QR transactionnel actif"}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="h-4 w-4 text-primary" /> Fil transactionnel
        </p>
        {events.length === 0 ? (
          <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            Les événements apparaîtront ici dès que le vendeur répondra.
          </p>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <TransactionEventRow key={event.id} event={event} {...(onRetry ? { onRetry } : {})} />
            ))}
          </ol>
        )}
      </div>

      {paymentPending ? (
        <Button className="w-full" disabled={busy} onClick={onConfirmPayment}>
          {busy ? "Confirmation…" : "J'ai payé"}
        </Button>
      ) : null}

      {canConfirmReceived ? (
        <Button className="w-full" disabled={busy} onClick={onConfirmReceived}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {busy ? "Confirmation…" : "Je confirme la réception"}
        </Button>
      ) : null}

      <TransactionMessageThread
        facilityId={order.facility_id}
        transactionId={order.transaction_id}
      />
    </div>
  );
}

function TransactionEventRow({
  event,
  onRetry,
}: {
  event: TransactionEvent;
  onRetry?: () => void;
}) {
  const error = ERROR_EVENTS.has(event.event_type);
  return (
    <li
      className={`rounded-xl border p-3 text-xs ${error ? "border-destructive/50 bg-destructive/8" : "border-border"}`}
    >
      <div className="flex items-start gap-2">
        {error ? (
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        ) : (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold">
              {EVENT_LABEL[event.event_type] ?? event.event_type}
            </span>
            <time className="shrink-0 text-muted-foreground" dateTime={event.created_at}>
              {new Date(event.created_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
          {event.metadata["message"] ? (
            <p className="mt-1 text-muted-foreground">{String(event.metadata["message"])}</p>
          ) : null}
          {error ? (
            <button
              type="button"
              className="mt-2 font-semibold text-destructive underline"
              onClick={onRetry}
            >
              Réessayer
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
