import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  adjustWallet,
  getPlatformMetrics,
  listAdminDeposits,
  listAudit,
  type AdminDepositRow,
  type AuditRow,
  type PlatformMetrics,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatFcfa, formatDateFr } from "@/lib/omni";

const DEPOSIT_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Créditée",
  declined: "Refusée",
  canceled: "Annulée",
};

/** Phase 4 — suivi des paiements, corrections de portefeuille et journal d'audit. */
export function OpsPanel() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [deposits, setDeposits] = useState<AdminDepositRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchMetrics = useServerFn(getPlatformMetrics);
  const fetchDeposits = useServerFn(listAdminDeposits);
  const fetchAudit = useServerFn(listAudit);
  const adjustFn = useServerFn(adjustWallet);

  const reload = useCallback(async () => {
    try {
      const [m, d, a] = await Promise.all([fetchMetrics(), fetchDeposits(), fetchAudit()]);
      setMetrics(m);
      setDeposits(d);
      setAudit(a);
    } catch {
      setMetrics(null);
    }
  }, [fetchMetrics, fetchDeposits, fetchAudit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submitAdjustment() {
    const value = Number(amount);
    if (!target.trim() || !Number.isFinite(value) || value === 0 || reason.trim().length < 3) {
      toast.error("Renseignez le commerce, un montant non nul et un motif.");
      return;
    }
    setBusy(true);
    try {
      const res = await adjustFn({
        data: { facilityId: target.trim(), amount: Math.trunc(value), reason: reason.trim() },
      });
      toast.success(`Nouveau solde : ${formatFcfa(res.balance)}`);
      setAmount("");
      setReason("");
      await reload();
    } catch {
      toast.error("Ajustement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-xl font-bold">Paiements et plateforme</h2>
        <p className="text-sm text-muted-foreground">
          Recharges FedaPay, soldes portefeuille et journal d'audit.
        </p>
      </header>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Recharges créditées", formatFcfa(metrics.deposits_total)],
            ["Recharges réussies", metrics.deposits_approved],
            ["Recharges en attente", metrics.deposits_pending],
            ["Portefeuilles", formatFcfa(metrics.wallet_total)],
            ["À reverser", formatFcfa(metrics.payout_total)],
            ["Commerces Pro", metrics.pro_facilities],
            ["Demandes en attente", metrics.carts_pending],
            ["Comptes", metrics.users],
          ].map(([label, value]) => (
            <div key={String(label)} className="omni-card p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-display text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="omni-card space-y-3 p-4">
        <h3 className="font-semibold">Ajustement de portefeuille</h3>
        <p className="text-xs text-muted-foreground">
          Montant en FCFA, négatif pour un débit. Chaque correction est tracée dans l'audit.
        </p>
        <div className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="ID du commerce"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Input
            placeholder="Montant (ex. 5000 ou -2000)"
            value={amount}
            inputMode="numeric"
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder="Motif"
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button disabled={busy} onClick={() => void submitAdjustment()}>
            Appliquer
          </Button>
        </div>
      </div>

      <div className="omni-card p-4">
        <h3 className="mb-2 font-semibold">Dernières recharges</h3>
        {deposits.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune recharge enregistrée.</p>
        )}
        <ul className="space-y-2">
          {deposits.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
            >
              <div>
                <p className="font-medium">{d.facility_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateFr(d.created_at)} · {d.provider_txn_id ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatFcfa(d.amount)}</span>
                <Badge variant={d.status === "approved" ? "default" : "outline"}>
                  {DEPOSIT_LABEL[d.status] ?? d.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="omni-card p-4">
        <h3 className="mb-2 font-semibold">Journal d'audit</h3>
        <ul className="space-y-1 text-sm">
          {audit.map((a) => (
            <li key={a.id} className="flex justify-between gap-3 border-b border-border py-1">
              <span className="font-mono text-xs">{a.action}</span>
              <span className="text-xs text-muted-foreground">
                {a.entity_type} · {formatDateFr(a.created_at)}
              </span>
            </li>
          ))}
          {audit.length === 0 && (
            <li className="text-sm text-muted-foreground">Aucune action enregistrée.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
