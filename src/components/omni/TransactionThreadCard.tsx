import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, CheckCircle2, Clock3, Copy, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionProgress } from "@/components/omni/ui/OmniPrimitives";
import { TransactionMessageThread } from "@/components/omni/TransactionMessageThread";
import type { BuyerOrder, TransactionEvent, TransactionTimeline } from "@/lib/checkout.functions";
import { buildTransactionLink, type PaymentPreferenceMethod } from "@/lib/omni-v1-contracts";
import { deriveTransactionUiState, TRANSACTION_STATUS_LABEL } from "@/lib/transaction-state";
import { TRANSACTION_PROGRESS_LABELS } from "@/lib/transaction-progress";

const EVENT_LABEL: Record<string, string> = {
  intent_created: "Intention créée",
  offer_confirmed: "Offre confirmée",
  coupon_applied: "Coupon appliqué",
  qr_generated: "QR généré",
  seller_verified: "Vendeur vérifié",
  payment_pending: "Paiement à choisir",
  payment_preference_selected: "Mode de paiement choisi",
  payment_declared: "Paiement déclaré par le buyer",
  payment_confirmed: "Paiement reçu par le vendeur",
  fulfillment_started: "Colis en route",
  product_received: "Marchandise reçue",
  completed: "Transaction terminée",
  cancelled: "Transaction annulée",
  expired: "QR expiré",
};

const ERROR_EVENTS = new Set([
  "cancelled",
  "expired",
  "payment_failed",
  "coupon_rejected",
  "error",
]);

const PAYMENT_METHODS: { value: PaymentPreferenceMethod; label: string; detail: string }[] = [
  {
    value: "cash_on_delivery",
    label: "Cash à la livraison",
    detail: "Vous payez lors de la remise.",
  },
  { value: "tmoney", label: "TMoney", detail: "Paiement externe avec le contact du vendeur." },
  { value: "flooz", label: "Flooz", detail: "Paiement externe avec le contact du vendeur." },
  {
    value: "external_other",
    label: "Autre paiement externe",
    detail: "À convenir avec le vendeur.",
  },
];

export function TransactionThreadCard({
  order,
  timeline,
  busy,
  onGenerateQr,
  onSelectPayment,
  onDeclarePayment,
  onConfirmReceived,
  onRetry,
}: {
  order: BuyerOrder;
  timeline?: TransactionTimeline | undefined;
  busy: boolean;
  onGenerateQr: () => void;
  onSelectPayment?: (method: PaymentPreferenceMethod) => void;
  onDeclarePayment?: () => void;
  onConfirmReceived: () => void;
  onRetry?: () => void;
}) {
  const transaction = timeline?.transaction;
  const qrToken = order.qr_token ?? transaction?.qr_token ?? null;
  const qrExpiry = order.qr_expires_at ?? transaction?.qr_expires_at ?? null;
  const qrActive = Boolean(qrToken && (!qrExpiry || new Date(qrExpiry).getTime() > Date.now()));
  const currentStatus = order.transaction_status ?? order.status;
  const paymentPreference = transaction?.payment_preference ?? null;
  const uiState = deriveTransactionUiState(currentStatus, qrActive, paymentPreference);
  const accepted = order.status === "confirmed" || order.status === "partially_confirmed";
  const canGenerate =
    order.source === "intent"
      ? uiState.canGenerateQr
      : accepted && !qrActive && currentStatus !== "completed";
  const events = timeline?.events ?? [];
  const progress = uiState.currentStep;
  const qrLink = qrToken
    ? buildTransactionLink(
        typeof window === "undefined" ? "https://omni.sparkafrika.online" : window.location.origin,
        qrToken,
      )
    : null;

  async function copyQr(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Copie indisponible sur cet appareil.");
    }
  }

  async function shareQr() {
    if (!qrLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Transaction Omni · ${order.facility_name}`,
          text: "Ouvrez ce lien Omni pour retrouver la transaction après connexion.",
          url: qrLink,
        });
      } else {
        await copyQr(qrLink, "Lien sécurisé copié.");
      }
    } catch {
      // A canceled native share is not an application error.
    }
  }

  return (
    <div className="omni-card min-w-0 space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{order.facility_name}</p>
          <p className="break-words text-sm text-muted-foreground">
            {order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}
          </p>
        </div>
        <Badge variant="outline">{TRANSACTION_STATUS_LABEL[currentStatus] ?? currentStatus}</Badge>
      </div>

      <TransactionProgress steps={[...TRANSACTION_PROGRESS_LABELS]} current={progress} />

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
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copyQr(qrToken, "Code QR copié.")}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copier le code
            </Button>
            <Button variant="outline" size="sm" onClick={() => void shareQr()}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" /> Partager le lien
            </Button>
          </div>
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

      {uiState.canChoosePayment && onSelectPayment ? (
        <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <div>
            <p className="font-semibold">Choisissez comment vous paierez</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Omni enregistre votre choix ; le paiement buyer-vendeur reste externe à l’application.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                className="rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => onSelectPayment(method.value)}
                disabled={busy}
              >
                <span className="block text-sm font-semibold">{method.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{method.detail}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {paymentPreference ? (
        <div className="space-y-2 rounded-2xl border border-border bg-muted/35 p-3">
          <p className="text-sm font-semibold">
            Mode choisi :{" "}
            {PAYMENT_METHODS.find((method) => method.value === paymentPreference)?.label ??
              paymentPreference}
          </p>
          {transaction?.seller_contact && paymentPreference !== "cash_on_delivery" ? (
            <p className="rounded-xl bg-card p-3 text-sm">
              Contact paiement vendeur : <strong>{transaction.seller_contact}</strong>
            </p>
          ) : null}
          {uiState.canDeclarePayment && onDeclarePayment ? (
            <Button className="w-full" disabled={busy} onClick={onDeclarePayment}>
              {busy ? "Enregistrement…" : "J’ai payé"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {uiState.canConfirmReceived ? (
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
