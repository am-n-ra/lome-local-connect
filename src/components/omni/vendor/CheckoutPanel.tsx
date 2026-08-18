import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
import { toast } from "sonner";
import { Camera, CameraOff, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  confirmTransactionPayment,
  getConfirmationProgress,
  listVendorTransactions,
  redeemCheckout,
  startTransactionFulfillment,
  type VendorTransaction,
} from "@/lib/checkout.functions";
import { STATUS_LABEL } from "@/lib/omni";
import { cameraStatusLabel, type CameraScannerStatus } from "@/lib/camera-scanner";
import { useMarket } from "@/lib/market";

export function CheckoutPanel({
  facilityId,
  initialTransactionId,
}: {
  facilityId: string;
  initialTransactionId?: string;
}) {
  const { formatMoney } = useMarket();
  const redeem = useServerFn(redeemCheckout);
  const confirmPayment = useServerFn(confirmTransactionPayment);
  const startFulfillment = useServerFn(startTransactionFulfillment);
  const fetchTransactions = useServerFn(listVendorTransactions);
  const fetchProgress = useServerFn(getConfirmationProgress);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraScannerStatus>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [rows, setRows] = useState<VendorTransaction[]>([]);
  const [focusedTransactionId, setFocusedTransactionId] = useState<string | null>(
    initialTransactionId ?? null,
  );
  const [progress, setProgress] = useState<{
    buyers: number;
    required: number;
    status: string | null;
  }>({ buyers: 0, required: 3, status: null });
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [lastValidated, setLastValidated] = useState<{
    transactionId: string;
    amount: number;
    platformFee: number;
    payout: number;
    verifiedAt: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [txns, prog] = await Promise.all([
        fetchTransactions({ data: { facilityId } }),
        fetchProgress({ data: { facilityId } }),
      ]);
      setRows(txns);
      setProgress(prog);
      if (initialTransactionId && txns.some((transaction) => transaction.id === initialTransactionId)) {
        setFocusedTransactionId(initialTransactionId);
      }
    } catch {
      setRows([]);
    }
  }, [facilityId, fetchProgress, fetchTransactions, initialTransactionId]);

  useEffect(() => {
    void refresh();
    return () => stopScanner();
  }, [refresh]);

  function stopScanner() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setCameraStatus("idle");
  }

  async function waitForVideoElement(timeoutMs = 2500): Promise<HTMLVideoElement | null> {
    const deadline = Date.now() + timeoutMs;
    while (!videoRef.current && Date.now() < deadline) {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
    return videoRef.current;
  }

  async function startScanner() {
    setCameraError(null);
    setCameraStatus("permission_pending");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      setCameraError(
        "La caméra n’est pas disponible dans ce navigateur. Saisissez le code manuellement.",
      );
      return;
    }
    try {
      // Request permission before checking QR decoding support. On Safari and
      // Firefox BarcodeDetector may be absent even though camera preview works.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      // Render the preview first. The video element does not exist until this state
      // update commits; checking videoRef immediately after getUserMedia caused the
      // previous implementation to stop the stream and turn the camera light off.
      setScanning(true);
      const video = await waitForVideoElement();
      if (!video || !streamRef.current) {
        stopScanner();
        setCameraStatus("error");
        setCameraError("Aperçu caméra indisponible. Saisissez le code manuellement.");
        return;
      }
      video.srcObject = streamRef.current;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      setCameraStatus("active");

      if (!("BarcodeDetector" in window)) {
        setCameraError(
          "Aperçu caméra actif. Le scan automatique n’est pas disponible ici : saisissez le code QR sous la caméra.",
        );
        return;
      }

      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector: new (options?: { formats?: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const [result] = await detector.detect(videoRef.current);
          if (result?.rawValue) {
            setCode(result.rawValue.toUpperCase().trim());
            stopScanner();
            toast.success("QR lu. Vérifiez le code puis validez la vente.");
            return;
          }
        } catch {
          // A frame can be unreadable while the camera is starting; keep scanning.
        }

        frameRef.current = requestAnimationFrame(() => void scan());
      };
      frameRef.current = requestAnimationFrame(() => void scan());
    } catch (error) {
      stopScanner();
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      setCameraStatus(denied ? "denied" : "unsupported");
      setCameraError(
        denied
          ? "Accès caméra refusé. Autorisez la caméra ou saisissez le code manuellement."
          : "Caméra indisponible. Saisissez le code manuellement.",
      );
    }
  }

  async function validate() {
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      const result = await redeem({ data: { facilityId, code: code.trim() } });
      setLastValidated({
        transactionId: result.transactionId,
        amount: result.amount,
        platformFee: result.platformFee,
        payout: result.payout,
        verifiedAt: new Date().toISOString(),
      });
      toast.success(
        `QR vérifié : ${formatMoney(result.amount)}. Attendez la confirmation du paiement par l'acheteur.`,
      );
      setCode("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSellerPayment(transactionId: string) {
    setActionBusy(transactionId);
    try {
      await confirmPayment({ data: { transactionId } });
      toast.success("Paiement seller confirmé. Vous pouvez lancer la remise.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Confirmation paiement impossible.");
    } finally {
      setActionBusy(null);
    }
  }

  async function beginFulfillment(transactionId: string) {
    setActionBusy(transactionId);
    try {
      await startFulfillment({ data: { transactionId } });
      toast.success("Remise/expédition lancée. Le buyer peut confirmer la réception.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Démarrage impossible.");
    } finally {
      setActionBusy(null);
    }
  }

  const pct = Math.min(100, Math.round((progress.buyers / progress.required) * 100));
  const focusedTransaction = focusedTransactionId
    ? rows.find((transaction) => transaction.id === focusedTransactionId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div className="omni-card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Valider une transaction sur place</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Demandez au client son code de transaction (QR ou 8 caractères) et vérifiez-le ici. Omni
          ne gère pas de paiement client in-app ni de retrait vendeur dans la V1.
        </p>
        <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto]">
          <Button
            type="button"
            variant={scanning ? "secondary" : "outline"}
            className="w-full sm:w-auto"
            onClick={() => (scanning ? stopScanner() : void startScanner())}
            disabled={busy}
          >
            {scanning ? (
              <CameraOff className="mr-2 h-4 w-4" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {scanning ? "Arrêter caméra" : "Autoriser et démarrer la caméra"}
          </Button>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex. K7QM2PDX"
            className="min-w-0 flex-1 font-mono tracking-widest"
            maxLength={24}
          />
          <Button
            className="w-full shrink-0 sm:w-auto"
            disabled={busy}
            onClick={() => void validate()}
          >
            {busy ? "Validation…" : "Valider"}
          </Button>
        </div>
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/30 bg-slate-950"
          data-omni-camera-preview="true"
        >
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={`absolute inset-0 h-full w-full object-cover ${scanning ? "opacity-100" : "opacity-0"}`}
            aria-label="Aperçu caméra QR"
          />
          {scanning ? (
            <>
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
              <p className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white">
                Caméra active · Cadrez le QR de transaction
              </p>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
              <Camera className="h-9 w-9 text-primary" />
              <div>
                <p className="font-semibold">Prêt à scanner</p>
                <p className="mt-1 text-xs text-white/70">
                  Appuyez sur « Autoriser et démarrer la caméra », puis cadrez le QR du client.
                </p>
              </div>
              <p className="text-[11px] text-white/60">
                Si la caméra est refusée ou indisponible, saisissez le code manuellement ci-dessus.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span aria-live="polite">{cameraStatusLabel(cameraStatus)}</span>
          {cameraError && <span>{cameraError}</span>}
        </div>
      </div>

      {focusedTransaction ? (
        <div className="omni-card space-y-3 border-primary/30 bg-primary/5 p-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Room transactionnelle
              </p>
              <h3 className="mt-1 font-display text-lg font-bold">
                {focusedTransaction.buyer_name ?? "Client"}
              </h3>
            </div>
            <Badge variant="outline">{focusedTransaction.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-background/80 p-3">
              <span className="block text-xs text-muted-foreground">Montant</span>
              <strong>{formatMoney(focusedTransaction.amount)}</strong>
            </div>
            <div className="rounded-xl bg-background/80 p-3">
              <span className="block text-xs text-muted-foreground">Paiement</span>
              <strong>{focusedTransaction.payment_preference ?? "À choisir"}</strong>
            </div>
          </div>
          {focusedTransaction.status === "payment_pending" &&
          focusedTransaction.payment_preference &&
          (focusedTransaction.payment_preference === "cash_on_delivery" ||
            focusedTransaction.buyer_payment_declared_at) ? (
            <Button
              className="w-full"
              disabled={actionBusy === focusedTransaction.id}
              onClick={() => void confirmSellerPayment(focusedTransaction.id)}
            >
              {actionBusy === focusedTransaction.id ? "Confirmation…" : "Confirmer le paiement reçu"}
            </Button>
          ) : null}
          {focusedTransaction.status === "paid" ? (
            <Button
              className="w-full"
              disabled={actionBusy === focusedTransaction.id}
              onClick={() => void beginFulfillment(focusedTransaction.id)}
            >
              {actionBusy === focusedTransaction.id ? "Mise à jour…" : "Lancer la remise ou la livraison"}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setFocusedTransactionId(null)}
          >
            Voir toutes les transactions
          </Button>
        </div>
      ) : null}

      {lastValidated ? (
        <div className="omni-card space-y-3 border-primary/30 bg-primary/5 p-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                QR vérifié
              </p>
              <h3 className="mt-1 font-display text-lg font-bold">
                Paiement et remise à suivre dans le thread
              </h3>
            </div>
            <Badge>Étape 4/5</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Le code est autorisé pour cette facility. Le buyer choisit le mode de paiement dans son
            thread ; vous confirmez ensuite la réception du paiement, puis le démarrage de la
            remise.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-background/80 p-2">
              <span className="block text-muted-foreground">Montant</span>
              <strong>{formatMoney(lastValidated.amount)}</strong>
            </div>
            <div className="rounded-xl bg-background/80 p-2">
              <span className="block text-muted-foreground">Commission</span>
              <strong>{formatMoney(lastValidated.platformFee)}</strong>
            </div>
            <div className="rounded-xl bg-background/80 p-2">
              <span className="block text-muted-foreground">Payout prévu</span>
              <strong>{formatMoney(lastValidated.payout)}</strong>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Vérifié à{" "}
            {new Date(lastValidated.verifiedAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · Aucun retrait vendeur n’est disponible en V1.
          </p>
        </div>
      ) : null}

      <div className="omni-card space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold">Progression vers « Confirmé »</h3>
          <Badge variant="outline">
            {progress.status ? (STATUS_LABEL[progress.status] ?? progress.status) : "—"}
          </Badge>
        </div>
        <Progress value={pct} />
        <p className="text-sm text-muted-foreground">
          {progress.buyers} / {progress.required} acheteurs distincts avec une transaction validée
          par QR.
        </p>
      </div>

      <div className="omni-card p-4">
        <h3 className="mb-2 font-display font-bold">Transactions récentes</h3>
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune transaction pour l'instant.</p>
        )}
        <ul className="space-y-2">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{t.buyer_name ?? "Client"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("fr-FR")} · commission{" "}
                  {formatMoney(t.platform_fee)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                <p className="font-semibold">{formatMoney(t.amount)}</p>
                <Badge variant={t.status === "completed" ? "default" : "outline"}>
                  {t.status === "completed"
                    ? "Terminée"
                    : t.status === "fulfillment"
                      ? "Remise en cours"
                      : t.status === "paid"
                        ? "Paiement confirmé"
                        : t.status === "payment_pending"
                          ? "Paiement à suivre"
                          : t.status}
                </Badge>
                {t.status === "payment_pending" &&
                t.payment_preference &&
                (t.payment_preference === "cash_on_delivery" || t.buyer_payment_declared_at) ? (
                  <Button
                    size="sm"
                    disabled={actionBusy === t.id}
                    onClick={() => void confirmSellerPayment(t.id)}
                  >
                    {actionBusy === t.id ? "Confirmation…" : "Confirmer le paiement"}
                  </Button>
                ) : null}
                {t.status === "paid" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionBusy === t.id}
                    onClick={() => void beginFulfillment(t.id)}
                  >
                    {actionBusy === t.id ? "Mise à jour…" : "Lancer la remise"}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
