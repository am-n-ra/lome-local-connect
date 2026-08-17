import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
import { toast } from "sonner";
import { Camera, CameraOff, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getConfirmationProgress,
  listVendorTransactions,
  redeemCheckout,
  type VendorTransaction,
} from "@/lib/checkout.functions";
import { STATUS_LABEL } from "@/lib/omni";
import { useMarket } from "@/lib/market";

export function CheckoutPanel({ facilityId }: { facilityId: string }) {
  const { formatMoney } = useMarket();
  const redeem = useServerFn(redeemCheckout);
  const fetchTransactions = useServerFn(listVendorTransactions);
  const fetchProgress = useServerFn(getConfirmationProgress);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "permission_pending" | "active" | "denied" | "unsupported"
  >("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [rows, setRows] = useState<VendorTransaction[]>([]);
  const [progress, setProgress] = useState<{
    buyers: number;
    required: number;
    status: string | null;
  }>({ buyers: 0, required: 3, status: null });

  const refresh = useCallback(async () => {
    try {
      const [txns, prog] = await Promise.all([
        fetchTransactions({ data: { facilityId } }),
        fetchProgress({ data: { facilityId } }),
      ]);
      setRows(txns);
      setProgress(prog);
    } catch {
      setRows([]);
    }
  }, [facilityId, fetchProgress, fetchTransactions]);

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
      setCameraError(
        "La caméra n’est pas disponible dans ce navigateur. Saisissez le code manuellement.",
      );
      return;
    }
    if (!("BarcodeDetector" in window)) {
      setCameraStatus("unsupported");
      setCameraError("Le scan QR n’est pas supporté ici. Saisissez le code manuellement.");
      return;
    }
    try {
      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector: new (options?: { formats?: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraStatus("active");
      setScanning(true);

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
      toast.success(
        `Vente validée : ${formatMoney(result.amount)} — commission ${formatMoney(
          result.platformFee,
        )}, à reverser ${formatMoney(result.payout)}.`,
      );
      setCode("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation impossible.");
    } finally {
      setBusy(false);
    }
  }

  const pct = Math.min(100, Math.round((progress.buyers / progress.required) * 100));

  return (
    <div className="space-y-4">
      <div className="omni-card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Encaisser une vente</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Demandez au client son code de retrait (QR ou 8 caractères) et validez-le ici. Le paiement
          se fait sur place ; le paiement en ligne est en mode démo.
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
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black">
          {scanning ? (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                className="aspect-[4/3] w-full object-cover"
                aria-label="Aperçu caméra QR"
              />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
              <p className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white">
                Caméra active · Cadrez le QR de retrait
              </p>
            </>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center text-white">
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
          <span aria-live="polite">
            {cameraStatus === "permission_pending"
              ? "Demande d’autorisation caméra…"
              : cameraStatus === "active"
                ? "Caméra prête à scanner"
                : cameraStatus === "denied"
                  ? "Caméra refusée — saisie manuelle disponible"
                  : cameraStatus === "unsupported"
                    ? "Scan indisponible — saisie manuelle disponible"
                    : "Scanner QR prêt sur cet appareil"}
          </span>
          {cameraError && <span>{cameraError}</span>}
        </div>
      </div>

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
              <div className="text-right">
                <p className="font-semibold">{formatMoney(t.amount)}</p>
                <Badge variant={t.status === "completed" ? "default" : "outline"}>
                  {t.status === "completed" ? "Encaissée" : "En attente"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
