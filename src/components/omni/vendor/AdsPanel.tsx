import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import {
  currentMonthKey,
  formatDateFr,
  formatFcfa,
  type FacilityRow,
  type ProductRow,
  type SubscriptionRow,
} from "@/lib/omni";
import {
  campaignActive,
  campaignCostFor,
  estimateReach,
  extendedProUntil,
  QUALIFYING_AMOUNT,
  RADIUS_OPTIONS,
  type AdCampaignRow,
  type WishlistRow,
} from "@/lib/vendor";

type Props = {
  facility: FacilityRow;
  products: ProductRow[];
  sub: SubscriptionRow | null;
  campaigns: AdCampaignRow[];
  wishlists: WishlistRow[];
  onSubChange: (sub: SubscriptionRow) => void;
  onCampaignsChange: (campaigns: AdCampaignRow[]) => void;
};

export function AdsPanel({
  facility,
  products,
  sub,
  campaigns,
  wishlists,
  onSubChange,
  onCampaignsChange,
}: Props) {
  const balance = sub?.wallet_balance ?? 0;
  const [builderOpen, setBuilderOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5000");
  const [selected, setSelected] = useState<string[]>([]);
  const [radius, setRadius] = useState<number | "city">(3);
  const [busy, setBusy] = useState(false);

  const cityWide = radius === "city";
  const radiusKm = cityWide ? null : (radius as number);
  const cost = campaignCostFor(radiusKm, cityWide);
  const reach = useMemo(
    () =>
      estimateReach(
        wishlists,
        { lat: facility.latitude, lng: facility.longitude },
        radiusKm,
        cityWide,
      ),
    [wishlists, facility.latitude, facility.longitude, radiusKm, cityWide],
  );
  const insufficient = cost > balance;

  async function launch() {
    if (!sub || insufficient || selected.length === 0) return;
    setBusy(true);
    const until = new Date();
    until.setDate(until.getDate() + 7);
    const { data, error } = await supabase
      .from("ad_campaigns")
      .insert({
        facility_id: facility.id,
        product_ids: selected,
        radius_km: radiusKm,
        is_city_wide: cityWide,
        cost_fcfa: cost,
        reach_estimate: reach,
        campaign_active_until: until.toISOString(),
      })
      .select("*")
      .single();
    if (error || !data) {
      setBusy(false);
      toast.error("Lancement impossible.");
      return;
    }
    const qualifying = cost >= QUALIFYING_AMOUNT;
    const patch = {
      wallet_balance: balance - cost,
      ...(qualifying
        ? {
            tier: "pro",
            pro_active_until: extendedProUntil(sub.pro_active_until),
            last_qualifying_action_month: currentMonthKey(),
          }
        : {}),
    };
    const { data: s } = await supabase
      .from("subscriptions")
      .update(patch)
      .eq("facility_id", facility.id)
      .select("*")
      .single();
    if (s) onSubChange(s as SubscriptionRow);
    onCampaignsChange([data as AdCampaignRow, ...campaigns]);
    setBusy(false);
    setBuilderOpen(false);
    setSelected([]);
    toast.success(
      "Campagne lancée. Vos produits sélectionnés sont mis en avant dans les résultats de recherche pour les 7 prochains jours.",
    );
  }

  async function deposit() {
    if (!sub) return;
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    const qualifying = amount >= QUALIFYING_AMOUNT;
    const { data: s } = await supabase
      .from("subscriptions")
      .update({
        wallet_balance: balance + Math.round(amount),
        ...(qualifying
          ? {
              tier: "pro",
              pro_active_until: extendedProUntil(sub.pro_active_until),
              last_qualifying_action_month: currentMonthKey(),
            }
          : {}),
      })
      .eq("facility_id", facility.id)
      .select("*")
      .single();
    if (!s) {
      toast.error("Dépôt impossible.");
      return;
    }
    onSubChange(s as SubscriptionRow);
    setDepositOpen(false);
    toast.success(`${formatFcfa(amount)} ajoutés (mode démo).`);
  }

  return (
    <div className="space-y-4">
      <div className="omni-card flex flex-wrap items-center gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Budget publicitaire disponible</p>
          <p className="font-display text-3xl font-extrabold text-primary">{formatFcfa(balance)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setDepositOpen(true)}>
            Déposer plus
          </Button>
          <Button onClick={() => setBuilderOpen(true)}>Créer une campagne</Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
        Votre fiche apparaît en position boostée (badge <strong>Sponsorisé</strong>) dans les résultats
        de recherche tant que votre palier est Pro. Une campagne est une mise en avant supplémentaire,
        ciblée sur des produits précis.
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
                  <td>{formatFcfa(c.cost_fcfa)}</td>
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
            <DialogDescription>Mettez vos produits en avant auprès des acheteurs proches.</DialogDescription>
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
                    {p.name} — {formatFcfa(p.price)}
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
                      radius === r ? "border-primary bg-primary text-primary-foreground" : "border-border"
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
                Coût estimé : <strong>{formatFcfa(cost)}</strong>
              </p>
              <p className="text-muted-foreground">Portée estimée : ~{reach} acheteurs à proximité</p>
            </div>

            {insufficient && (
              <p className="text-sm text-destructive">Solde insuffisant, déposez plus pour continuer.</p>
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
            <DialogDescription>Mode démo, aucune transaction réelle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="dep">Montant (FCFA)</Label>
            <Input
              id="dep"
              inputMode="numeric"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => void deposit()}>Confirmer (mode démo)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
