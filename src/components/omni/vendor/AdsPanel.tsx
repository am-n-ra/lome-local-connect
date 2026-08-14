import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateFr } from "@/lib/omni";
import { useMarket } from "@/lib/market";
import { campaignCostFor, RADIUS_OPTIONS } from "@/lib/vendor";
import {
  createCampaign,
  estimateCampaignReach,
  type VendorCampaign,
  type VendorFacility,
  type VendorProduct,
  type VendorSubscription,
} from "@/lib/vendor.functions";
import { createWalletDeposit } from "@/lib/payments.functions";

type Props = {
  facility: VendorFacility;
  products: VendorProduct[];
  subscription: VendorSubscription | null;
  campaigns: VendorCampaign[];
  onRefresh: () => void | Promise<void>;
};

function campaignActive(c: VendorCampaign): boolean {
  return !!c.campaign_active_until && new Date(c.campaign_active_until).getTime() > Date.now();
}

export function AdsPanel({ facility, products, subscription, campaigns, onRefresh }: Props) {
  const { formatMoney, market } = useMarket();
  const balance = subscription?.wallet_balance ?? 0;
  const [builderOpen, setBuilderOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5000");
  const [selected, setSelected] = useState<string[]>([]);
  const [radius, setRadius] = useState<number | "city">(3);
  const [reach, setReach] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const cityWide = radius === "city";
  const radiusKm = cityWide ? null : (radius as number);
  const cost = campaignCostFor(radiusKm, cityWide);
  const insufficient = cost > balance;

  const estimate = useServerFn(estimateCampaignReach);
  const launchCampaign = useServerFn(createCampaign);
  const deposit = useServerFn(createWalletDeposit);

  useEffect(() => {
    if (!builderOpen) return;
    let active = true;
    void (async () => {
      try {
        const result = await estimate({ data: { facilityId: facility.id, radiusKm, cityWide } });
        if (active) setReach(result.reach);
      } catch {
        if (active) setReach(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [builderOpen, estimate, facility.id, radiusKm, cityWide]);

  async function launch() {
    if (insufficient || selected.length === 0) return;
    setBusy(true);
    try {
      await launchCampaign({
        data: { facilityId: facility.id, productIds: selected, radiusKm, cityWide, durationDays: 7 },
      });
      await onRefresh();
      setBuilderOpen(false);
      setSelected([]);
      toast.success("Campagne lancée. Vos produits sont mis en avant pendant 7 jours.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lancement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeposit() {
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount < 500) {
      toast.error(`Montant invalide (${formatMoney(500)} minimum).`);
      return;
    }
    setBusy(true);
    try {
      const { url } = await deposit({
        data: { facilityId: facility.id, amount: Math.round(amount) },
      });
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dépôt impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="omni-card flex flex-wrap items-center gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Budget publicitaire disponible</p>
          <p className="font-display text-3xl font-extrabold text-primary">{formatMoney(balance)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setDepositOpen(true)}>
            Déposer plus
          </Button>
          <Button onClick={() => setBuilderOpen(true)}>Créer une campagne</Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
        Votre fiche apparaît en position boostée (badge <strong>Sponsorisé</strong>) dans les
        résultats de recherche tant que votre palier est Pro. Une campagne est une mise en avant
        supplémentaire, ciblée sur des produits précis.
      </div>

      <div className="omni-card p-5">
        <p className="font-display text-lg font-bold">Historique des campagnes</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Date</th>
                <th>Ciblage</th>
                <th>Produits</th>
                <th>Coût</th>
                <th>Portée</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-2">{formatDateFr(c.created_at)}</td>
                  <td>{c.is_city_wide ? "Tout Lomé" : `${c.radius_km} km`}</td>
                  <td>{c.product_ids.length}</td>
                  <td>{formatMoney(c.cost_fcfa)}</td>
                  <td>~{c.reach_estimate}</td>
                  <td>
                    <Badge variant={campaignActive(c) ? "default" : "secondary"}>
                      {campaignActive(c) ? "Actif" : "Terminé"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-muted-foreground">
                    Aucune campagne pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une campagne</DialogTitle>
            <DialogDescription>
              Mettez vos produits en avant auprès des acheteurs proches.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">1. Produits à mettre en avant</p>
              <div className="mt-2 space-y-2">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) =>
                          v ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                        )
                      }
                    />
                    {p.name} — {formatMoney(p.price)}
                  </label>
                ))}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ajoutez d'abord des produits.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">2. Rayon de ciblage</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      radius === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRadius("city")}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    cityWide ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  Tout Lomé
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-secondary p-3 text-sm">
              <p>
                Coût estimé : <strong>{formatMoney(cost)}</strong>
              </p>
              <p className="text-muted-foreground">
                Portée estimée : {reach === null ? "calcul…" : `~${reach} acheteurs à proximité`}
              </p>
            </div>

            {insufficient && (
              <p className="text-sm text-destructive">
                Solde insuffisant, déposez plus pour continuer.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={busy || insufficient || selected.length === 0}
              onClick={() => void launch()}
            >
              {busy ? "Lancement…" : "Confirmer et lancer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déposer plus</DialogTitle>
            <DialogDescription>
              Paiement sécurisé par FedaPay : carte bancaire, Flooz ou T-Money.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="dep">{`Montant (${market?.currency_symbol ?? "FCFA"})`}</Label>
            <Input
              id="dep"
              inputMode="numeric"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button disabled={busy} onClick={() => void confirmDeposit()}>
              {busy ? "Redirection…" : "Payer maintenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
