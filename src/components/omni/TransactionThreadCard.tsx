import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, CheckCircle2, Clock3, Copy, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OmniActionBlock, TransactionProgress } from "@/components/omni/ui/OmniPrimitives";
import { TransactionMessageThread } from "@/components/omni/TransactionMessageThread";
import type { BuyerOrder, TransactionEvent, TransactionTimeline } from "@/lib/checkout.functions";
import {
  buildTransactionLink,
  deriveTransactionRoomAction,
  type PaymentPreferenceMethod,
  type TransactionRoomStatus,
} from "@/lib/omni-v1-contracts";
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
  received_confirmed: "Réception confirmée",
  rating_submitted: "Avis publié",
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
  onRegenerateQr,
  onCreateRoom,
  onSelectPayment,
  onDeclarePayment,
  onConfirmReceived,
  onSubmitRating,
  onRetry,
}: {
  order: BuyerOrder;
  timeline?: TransactionTimeline | undefined;
  busy: boolean;
  onRegenerateQr?: () => void;
  onCreateRoom?: () => void;
  onSelectPayment?: (method: PaymentPreferenceMethod) => void;
  onDeclarePayment?: () => void;
  onConfirmReceived: () => void;
  onSubmitRating?: (rating: number, comment: string) => void;
  onRetry?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const transaction = timeline?.transaction;
  const qrToken = order.qr_token ?? transaction?.qr_token ?? null;
  const qrExpiry = order.qr_expires_at ?? transaction?.qr_expires_at ?? null;
  const qrActive = Boolean(qrToken && (!qrExpiry || new Date(qrExpiry).getTime() > Date.now()));
  const currentStatus = order.transaction_status ?? order.status;
  const paymentPreference = transaction?.payment_preference ?? null;
  const uiState = deriveTransactionUiState(currentStatus, qrActive, paymentPreference);
  const accepted = order.status === "confirmed" || order.status === "partially_confirmed";
  const qrExpired = Boolean(qrToken && qrExpiry && new Date(qrExpiry).getTime() <= Date.now());
  const grossAmount = order.total;
  const netAmount = transaction?.amount ?? order.amount ?? order.total;
  const discountAmount = Math.max(0, grossAmount - netAmount);

  const roomAction = deriveTransactionRoomAction("buyer", currentStatus as TransactionRoomStatus, {
    hasQr: qrActive,
    paymentChoice:
      paymentPreference === "cash_on_delivery"
        ? "pay_on_delivery"
        : paymentPreference === "tmoney" || paymentPreference === "flooz" || paymentPreference === "external_other"
          ? "mobile_money"
          : null,
    buyerPaymentDeclared: Boolean(transaction?.buyer_payment_declared_at),
  });
  const nextActionLabel: Record<string, string> = {
    present_qr: "Présenter le QR au vendeur",
    choose_payment: "Choisir le mode de paiement",
    declare_paid: "Déclarer le paiement",
    confirm_received: "Confirmer la réception",
    rate_transaction: "Noter la transaction",
  };
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
    <div className="omni-atlas-surface min-w-0 space-y-4 rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{order.facility_name}</p>
          <p className="break-words text-sm text-muted-foreground">
            {order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}
          </p>
        </div>
        <Badge variant="outline">{TRANSACTION_STATUS_LABEL[currentStatus] ?? currentStatus}</Badge>
      </div>

      <div className="rounded-[1.25rem] bg-[var(--atlas-paper)]/60 p-3">
        <TransactionProgress steps={[...TRANSACTION_PROGRESS_LABELS]} current={progress} />
      </div>

      <div className="grid gap-2 rounded-[1.25rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/72 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Montant catalogue</span>
          <span>{grossAmount.toLocaleString("fr-FR")} F</span>
        </div>
        {discountAmount > 0 ? (
          <div className="flex items-center justify-between gap-3 text-forest">
            <span>Réduction Omni</span>
            <span>−{discountAmount.toLocaleString("fr-FR")} F</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2">
          <span className="font-semibold">Net à payer</span>
          <span className="font-display text-xl font-bold text-primary">
            {netAmount.toLocaleString("fr-FR")} F
          </span>
        </div>
      </div>

      {qrExpired && onRegenerateQr ? (
        <Button className="w-full" disabled={busy} onClick={onRegenerateQr}>
          <QrCode className="mr-2 h-4 w-4" />
          {busy ? "Régénération…" : "Générer un nouveau QR"}
        </Button>
      ) : null}
      {!qrToken && order.source === "cart" && accepted && onCreateRoom ? (
        <Button className="w-full" disabled={busy} onClick={onCreateRoom}>
          <QrCode className="mr-2 h-4 w-4" />
          {busy ? "Ouverture…" : "Créer la room transactionnelle"}
        </Button>
      ) : null}
      {roomAction && roomAction !== "present_qr" && nextActionLabel[roomAction] ? (
        <OmniActionBlock
          title={nextActionLabel[roomAction]}
          description="La prochaine action est préparée ici. Le fil reste disponible sous ce bloc."
          tone={roomAction === "rate_transaction" ? "warning" : "default"}
        />
      ) : null}

      {qrToken && qrActive ? (
        <OmniActionBlock
          title="Montrez ce QR au vendeur"
          description="Le vendeur vérifie ce code avant que le choix de paiement externe ne soit disponible."
        >
        <div className="rounded-[1.35rem] bg-white p-4 text-center text-[var(--atlas-ink)] shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)]">
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
        </OmniActionBlock>
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
        <div className="omni-atlas-surface space-y-2 rounded-[1.25rem] p-3">
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

      {(currentStatus === "received" || currentStatus === "rating_pending") && onSubmitRating ? (
        <div className="omni-atlas-surface space-y-3 rounded-[1.25rem] p-3">
          <div>
            <p className="font-semibold">Votre avis est la dernière étape</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Notez le vendeur pour terminer la transaction. Vous pouvez modifier le commentaire avant l’envoi.
            </p>
          </div>
          <div className="flex items-center gap-1" aria-label="Choisir une note sur 5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Noter ${value} sur 5`}
                aria-pressed={rating === value}
                disabled={busy}
                onClick={() => setRating(value)}
                className={`rounded-lg p-1 text-2xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value <= rating ? "text-amber-500" : "text-muted-foreground/40"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Un commentaire (facultatif)"
            maxLength={600}
            className="min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Button
            className="w-full"
            disabled={busy || rating === 0}
            onClick={() => onSubmitRating(rating, comment)}
          >
            {busy ? "Envoi de l’avis…" : "Publier l’avis et terminer"}
          </Button>
        </div>
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
