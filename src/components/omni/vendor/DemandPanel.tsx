import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateFr, formatFcfa } from "@/lib/omni";
import { useMarket } from "@/lib/market";
import type { DemandSignal } from "@/lib/vendor.functions";
import {
  listDemandForFacility,
  respondToDemand,
  type VendorDemandRequest,
} from "@/lib/demand.functions";

export function DemandPanel({
  demand,
  facilityId,
}: {
  demand: DemandSignal[];
  facilityId: string;
}) {
  const { market } = useMarket();
  const list = useServerFn(listDemandForFacility);
  const respond = useServerFn(respondToDemand);
  const [live, setLive] = useState<VendorDemandRequest[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLive(await list({ data: { facilityId } }));
    } catch {
      setLive([]);
    }
  }, [facilityId, list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function answer(requestId: string, kind: "available" | "partial" | "unavailable") {
    setBusy(requestId);
    try {
      const raw = prices[requestId];
      const price = raw && raw.trim() ? Number(raw) : null;
      const rawQuantity = quantities[requestId];
      const availableQuantity = rawQuantity && rawQuantity.trim() ? Number(rawQuantity) : null;
      await respond({
        data: {
          facilityId,
          requestId,
          kind,
          price:
            kind !== "unavailable" && price !== null && Number.isFinite(price)
              ? Math.round(price)
              : null,
          quantity:
            kind !== "unavailable" &&
            availableQuantity !== null &&
            Number.isFinite(availableQuantity)
              ? Math.max(0, Math.round(availableQuantity))
              : null,
        },
      });
      toast.success("Réponse envoyée à l'acheteur.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réponse impossible.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold">Demandes en direct</h3>
        <p className="text-sm text-muted-foreground">
          Des acheteurs proches diffusent leur besoin. Répondez disponible, partiel ou indisponible
          avec votre prix et la quantité exacte disponible.
        </p>
        <ul className="space-y-2">
          {live.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.search_term}</p>
                <span className="text-xs text-muted-foreground">
                  {r.quantity} unité(s) · {formatDateFr(r.created_at)}
                  {r.distance_km !== null ? ` · ${r.distance_km.toFixed(1)} km` : ""}
                </span>
              </div>
              <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl bg-primary/8 p-3">
                {r.matched_product_photo_url ? (
                  <img
                    src={r.matched_product_photo_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                    ●
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                    Produit recherché
                  </p>
                  <p className="break-words text-sm font-semibold">
                    {r.matched_product_name ?? r.search_term}
                  </p>
                  <p className="break-words text-xs text-muted-foreground">
                    {r.matched_product_name
                      ? `Correspondance catalogue${r.matched_product_price != null ? ` · ${formatFcfa(r.matched_product_price)}` : ""}${r.matched_product_quantity != null ? ` · ${r.matched_product_quantity} disponible(s)` : ""}`
                      : "Correspondance à confirmer avant réponse"}
                  </p>
                </div>
              </div>
              {r.budget_max != null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Budget buyer :{" "}
                  <span className="font-semibold text-foreground">{formatFcfa(r.budget_max)}</span>
                </p>
              )}
              {!r.answered && r.matched_product_name && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    setPrices((current) => ({
                      ...current,
                      [r.id]:
                        r.matched_product_price != null
                          ? String(r.matched_product_price)
                          : (current[r.id] ?? ""),
                    }));
                    setQuantities((current) => ({
                      ...current,
                      [r.id]:
                        r.matched_product_quantity != null
                          ? String(r.matched_product_quantity)
                          : (current[r.id] ?? ""),
                    }));
                  }}
                >
                  Utiliser ce produit pour répondre
                </Button>
              )}
              {r.answered ? (
                <p className="mt-2 text-sm text-primary">Vous avez déjà répondu.</p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={`Prix ${market?.currency_symbol ?? "FCFA"}`}
                    className="h-9 w-32"
                    value={prices[r.id] ?? ""}
                    onChange={(e) => setPrices((p) => ({ ...p, [r.id]: e.target.value }))}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Qté dispo"
                    className="h-9 w-28"
                    value={quantities[r.id] ?? ""}
                    onChange={(e) => setQuantities((q) => ({ ...q, [r.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    disabled={busy === r.id}
                    onClick={() => void answer(r.id, "available")}
                  >
                    Disponible
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy === r.id}
                    onClick={() => void answer(r.id, "partial")}
                  >
                    Partiel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === r.id}
                    onClick={() => void answer(r.id, "unavailable")}
                  >
                    Indisponible
                  </Button>
                </div>
              )}
            </li>
          ))}
          {live.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune demande en direct actuellement.</p>
          )}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold">Tendances de recherche</h3>
        <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
          Ce que les acheteurs autour de vous cherchent sans trouver. Ajoutez ces produits à votre
          catalogue pour capter la demande.
        </div>
        <ul className="space-y-2">
          {demand.map((g) => (
            <li
              key={g.search_term}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium">{g.search_term}</p>
                <p className="text-sm text-muted-foreground">
                  {g.hits} recherche(s) · dernière le {formatDateFr(g.last_seen)}
                </p>
              </div>
            </li>
          ))}
          {demand.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune demande enregistrée pour l'instant.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}
