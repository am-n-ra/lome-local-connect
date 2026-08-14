import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { QrCode } from "lucide-react";
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
  }, [refresh]);

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
          Demandez au client son code de retrait (QR ou 8 caractères) et validez-le ici. Le
          paiement se fait sur place ; le paiement en ligne est en mode démo.
        </p>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex. K7QM2PDX"
            className="font-mono tracking-widest"
            maxLength={24}
          />
          <Button disabled={busy} onClick={() => void validate()}>
            {busy ? "Validation…" : "Valider"}
          </Button>
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
