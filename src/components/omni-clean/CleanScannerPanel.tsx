import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, CircleAlert, QrCode, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@/lib/useServerFn";
import { useMarket } from "@/lib/market";
import { cameraStatusLabel, type CameraScannerStatus } from "@/lib/camera-scanner";
import { STATUS_LABEL } from "@/lib/omni";
import { confirmTransactionPayment, getConfirmationProgress, listVendorTransactions, redeemCheckout, startTransactionFulfillment, type VendorTransaction } from "@/lib/checkout.functions";
import { cn } from "@/lib/utils";

type Props = { facilityId: string; initialTransactionId?: string };

type Progress = { buyers: number; required: number; status: string | null };

export function CleanScannerPanel({ facilityId, initialTransactionId }: Props) {
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
  const [rows, setRows] = useState<VendorTransaction[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(initialTransactionId ?? null);
  const [progress, setProgress] = useState<Progress>({ buyers: 0, required: 3, status: null });
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [lastValidated, setLastValidated] = useState<{ transactionId: string; amount: number; platformFee: number; payout: number; verifiedAt: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [transactions, confirmation] = await Promise.all([fetchTransactions({ data: { facilityId } }), fetchProgress({ data: { facilityId } })]);
      setRows(transactions);
      setProgress(confirmation);
      if (initialTransactionId && transactions.some((transaction) => transaction.id === initialTransactionId)) setFocusedId(initialTransactionId);
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

  async function startScanner() {
    setCameraError(null);
    setCameraStatus("permission_pending");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      setCameraError("La caméra HTTPS n’est pas disponible ici. Saisissez le code manuellement.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const video = videoRef.current;
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
        setCameraError("Aperçu actif. Le scan automatique n’est pas disponible ici : saisissez le code sous la caméra.");
        return;
      }
      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const [result] = await detector.detect(videoRef.current);
          if (result?.rawValue) {
            setCode(result.rawValue.toUpperCase().trim());
            stopScanner();
            toast.success("QR lu. Vérifiez le code puis validez.");
            return;
          }
        } catch {
          // Keep the preview alive while a frame is unreadable.
        }
        frameRef.current = requestAnimationFrame(() => void scan());
      };
      frameRef.current = requestAnimationFrame(() => void scan());
    } catch (error) {
      stopScanner();
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      setCameraStatus(denied ? "denied" : "unsupported");
      setCameraError(denied ? "Accès caméra refusé. Autorisez la caméra ou saisissez le code manuellement." : "Caméra indisponible. Saisissez le code manuellement.");
    }
  }

  async function validate() {
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      const result = await redeem({ data: { facilityId, code: code.trim() } });
      setLastValidated({ transactionId: result.transactionId, amount: result.amount, platformFee: result.platformFee, payout: result.payout, verifiedAt: new Date().toISOString() });
      setFocusedId(result.transactionId);
      setCode("");
      toast.success(`QR vérifié : ${formatMoney(result.amount)}.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(transactionId: string, action: () => Promise<unknown>, message: string) {
    setActionBusy(transactionId);
    try {
      await action();
      toast.success(message);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setActionBusy(null);
    }
  }

  const focused = focusedId ? rows.find((transaction) => transaction.id === focusedId) ?? null : null;
  const percent = Math.min(100, Math.round((progress.buyers / Math.max(1, progress.required)) * 100));

  return (
    <div className="space-y-4" data-omni-clean-scanner="true">
      <section className="space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Scanner QR</p><h2 className="mt-1 font-display text-2xl font-extrabold">Vérifier avant de remettre</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--omni-ink-muted)]">Présentez l’aperçu caméra au QR du buyer. Le paiement buyer-vendeur reste externe; aucun retrait seller n’est créé.</p></div><span className={cn("omni-clean-state-badge", cameraStatus === "active" && "bg-[#eef8f4] text-[var(--omni-success)]")}>{cameraStatusLabel(cameraStatus)}</span></div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#191817] shadow-inner sm:aspect-video"><video ref={videoRef} muted playsInline autoPlay className={cn("absolute inset-0 h-full w-full object-cover transition-opacity", (scanning || cameraStatus === "active") ? "opacity-100" : "opacity-0")} aria-label="Aperçu caméra QR" />{cameraStatus === "active" ? <><div className="pointer-events-none absolute inset-[14%] rounded-[1.5rem] border-2 border-white/85 shadow-[0_0_0_999px_rgba(0,0,0,.3)]" /><div className="absolute inset-x-0 bottom-3 text-center text-xs font-extrabold text-white">Cadrez le QR de transaction</div></> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white"><ScanLine className="h-9 w-9 text-[var(--omni-orange)]" /><p className="font-extrabold">Aperçu prêt</p><p className="max-w-sm text-xs leading-5 text-white/70">Autorisez la caméra pour garder le flux actif dans cette zone. Sinon, utilisez le code manuel.</p></div>}</div>
        <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => (scanning ? stopScanner() : void startScanner())} disabled={busy || cameraStatus === "permission_pending"} className="omni-clean-secondary-button min-h-12 sm:min-w-56">{scanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}{cameraStatus === "permission_pending" ? "Autorisation…" : scanning ? "Arrêter la caméra" : "Autoriser et démarrer"}</button><div className="flex min-w-0 flex-1 gap-2"><input className="omni-clean-field min-w-0 flex-1 font-mono tracking-[0.18em]" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Code QR ou 8 caractères" maxLength={64} /><button type="button" onClick={() => void validate()} disabled={busy || code.trim().length < 4} className="omni-clean-primary-button min-h-12">{busy ? "Vérification…" : "Valider"}</button></div></div>{cameraError ? <div className="flex items-start gap-2 rounded-2xl bg-[#fff7e9] p-3 text-sm font-semibold text-[var(--omni-warning)]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{cameraError}</div> : null}</section>

      {focused ? <section className="rounded-[1.4rem] border border-[var(--omni-success)]/25 bg-[#eef8f4] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--omni-success)]">Room transactionnelle</p><h3 className="mt-1 font-display text-xl font-extrabold">{focused.buyer_name ?? "Client"}</h3></div><span className="omni-clean-state-badge bg-white/75">{STATUS_LABEL[focused.status] ?? focused.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white/75 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Montant</p><p className="mt-1 font-display text-lg font-extrabold">{formatMoney(focused.amount)}</p></div><div className="rounded-2xl bg-white/75 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Paiement</p><p className="mt-1 font-display text-lg font-extrabold">{focused.payment_preference ?? "À choisir"}</p></div></div>{focused.status === "payment_pending" && focused.payment_preference && (focused.payment_preference === "cash_on_delivery" || focused.buyer_payment_declared_at) ? <button type="button" onClick={() => void runAction(focused.id, () => confirmPayment({ data: { transactionId: focused.id } }), "Paiement seller confirmé.")} disabled={actionBusy === focused.id} className="omni-clean-primary-button mt-3 min-h-12 w-full">{actionBusy === focused.id ? "Confirmation…" : "Confirmer le paiement reçu"}</button> : null}{focused.status === "paid" ? <button type="button" onClick={() => void runAction(focused.id, () => startFulfillment({ data: { transactionId: focused.id } }), "Remise ou livraison lancée.")} disabled={actionBusy === focused.id} className="omni-clean-primary-button mt-3 min-h-12 w-full">{actionBusy === focused.id ? "Mise à jour…" : "Lancer la remise ou la livraison"}</button> : null}<button type="button" onClick={() => setFocusedId(null)} className="omni-clean-secondary-button mt-2 min-h-11 w-full">Voir toutes les transactions</button></section> : null}

      {lastValidated ? <section className="rounded-[1.4rem] bg-[var(--omni-orange-wash)] p-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[var(--omni-success)]" /><p className="font-extrabold">QR vérifié et lié à cette facility</p></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div className="rounded-xl bg-white/65 p-2"><span className="block text-[var(--omni-ink-muted)]">Montant</span><strong>{formatMoney(lastValidated.amount)}</strong></div><div className="rounded-xl bg-white/65 p-2"><span className="block text-[var(--omni-ink-muted)]">Commission</span><strong>{formatMoney(lastValidated.platformFee)}</strong></div><div className="rounded-xl bg-white/65 p-2"><span className="block text-[var(--omni-ink-muted)]">Prévu</span><strong>{formatMoney(lastValidated.payout)}</strong></div></div><p className="mt-3 text-xs font-semibold text-[var(--omni-ink-muted)]">Le buyer choisit et déclare son paiement externe dans sa room. Aucun retrait vendeur n’est disponible en V1.</p></section> : null}

      <section className="rounded-[1.4rem] bg-[var(--omni-paper)] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--omni-ink-muted)]">Confiance</p><h3 className="mt-1 font-display text-lg font-extrabold">Progression vers Confirmed</h3></div><p className="font-display text-xl font-extrabold">{progress.buyers}/{progress.required}</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-[var(--omni-orange)] transition-[width]" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs font-semibold text-[var(--omni-ink-muted)]">Acheteurs distincts avec transaction validée par QR.</p></section>

      <section className="rounded-[1.4rem] border border-black/5 bg-white/70 p-4"><div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-[var(--omni-orange)]" /><h3 className="font-display text-lg font-extrabold">Transactions récentes</h3></div><div className="mt-3 space-y-2">{rows.length === 0 ? <p className="rounded-2xl bg-[var(--omni-paper)] p-3 text-sm text-[var(--omni-ink-muted)]">Aucune transaction pour l’instant.</p> : rows.map((transaction) => <button type="button" key={transaction.id} onClick={() => setFocusedId(transaction.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--omni-paper)] p-3 text-left"><div className="min-w-0"><p className="truncate font-extrabold">{transaction.buyer_name ?? "Client"}</p><p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{new Date(transaction.created_at).toLocaleString("fr-FR")}</p></div><div className="shrink-0 text-right"><p className="font-extrabold">{formatMoney(transaction.amount)}</p><span className="text-[10px] font-extrabold text-[var(--omni-orange-deep)]">{STATUS_LABEL[transaction.status] ?? transaction.status}</span></div></button>)}</div></section>
    </div>
  );
}
