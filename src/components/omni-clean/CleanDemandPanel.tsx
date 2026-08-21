import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Clock3, PackageSearch, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@/lib/useServerFn";
import { formatDateFr, formatFcfa } from "@/lib/omni";
import type { DemandSignal } from "@/lib/vendor.functions";
import {
  correctAutoResponse,
  listDemandForFacility,
  respondToDemand,
  type VendorDemandRequest,
} from "@/lib/demand.functions";

type Props = {
  demand: DemandSignal[];
  facilityId: string;
  onLiveCountChange?: (count: number) => void;
};

type AnswerKind = "available" | "partial" | "unavailable";

export function CleanDemandPanel({ demand, facilityId, onLiveCountChange }: Props) {
  const list = useServerFn(listDemandForFacility);
  const respond = useServerFn(respondToDemand);
  const correct = useServerFn(correctAutoResponse);
  const [live, setLive] = useState<VendorDemandRequest[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [correctionBusy, setCorrectionBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await list({ data: { facilityId } });
      setLive(next);
      onLiveCountChange?.(next.length);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [facilityId, list, onLiveCountChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function seedMatchedProduct(request: VendorDemandRequest) {
    setPrices((current) => ({
      ...current,
      [request.id]: request.matched_product_price != null ? String(request.matched_product_price) : current[request.id] ?? "",
    }));
    setQuantities((current) => ({
      ...current,
      [request.id]: request.matched_product_quantity != null ? String(request.matched_product_quantity) : current[request.id] ?? "",
    }));
  }

  async function answer(requestId: string, kind: AnswerKind) {
    setBusy(requestId);
    try {
      const rawPrice = prices[requestId]?.trim();
      const rawQuantity = quantities[requestId]?.trim();
      const price = rawPrice ? Number(rawPrice) : null;
      const quantity = rawQuantity ? Number(rawQuantity) : null;
      await respond({
        data: {
          facilityId,
          requestId,
          kind,
          price: kind !== "unavailable" && price !== null && Number.isFinite(price) ? Math.round(price) : null,
          quantity: kind !== "unavailable" && quantity !== null && Number.isFinite(quantity) ? Math.max(0, Math.round(quantity)) : null,
        },
      });
      toast.success("Réponse envoyée à l’acheteur.");
      await refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Réponse impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function correctAnswer(request: VendorDemandRequest, kind: AnswerKind) {
    if (!request.response_id) return;
    setCorrectionBusy(request.response_id);
    try {
      const rawPrice = prices[request.id]?.trim();
      const rawQuantity = quantities[request.id]?.trim();
      const price = rawPrice ? Number(rawPrice) : request.response_price;
      const quantity = rawQuantity ? Number(rawQuantity) : request.response_quantity;
      await correct({
        data: {
          responseId: request.response_id,
          kind,
          price: kind === "unavailable" ? null : typeof price === "number" && Number.isFinite(price) ? Math.round(price) : null,
          quantity: kind === "unavailable" ? null : typeof quantity === "number" && Number.isFinite(quantity) ? Math.max(0, Math.round(quantity)) : null,
        },
      });
      toast.success("Réponse automatique corrigée et acheteur notifié.");
      await refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Correction impossible.");
    } finally {
      setCorrectionBusy(null);
    }
  }

  return (
    <div className="space-y-5" data-omni-clean-demands>
      <header className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Demandes</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.04em]">Répondre à une demande réelle</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--omni-ink-muted)]">Répondez avec ce que votre facilité peut réellement fournir. Les prix et quantités envoyés restent ceux de votre réponse vendeur.</p>
      </header>

      <section className="space-y-3" aria-labelledby="clean-live-demands-title">
        <div className="flex items-center justify-between gap-3">
          <div><h3 id="clean-live-demands-title" className="font-display text-lg font-extrabold">Demandes en direct</h3><p className="text-xs font-semibold text-[var(--omni-ink-muted)]">{live.length} demande{live.length === 1 ? "" : "s"} à traiter</p></div>
          <button type="button" onClick={() => void refresh()} className="omni-clean-icon-button h-11 w-11" aria-label="Actualiser les demandes"><RefreshCw className="h-4 w-4" /></button>
        </div>

        {loading ? <div className="flex items-center gap-2 rounded-2xl bg-white/70 p-4 text-sm font-semibold text-[var(--omni-ink-muted)]"><Clock3 className="h-4 w-4 animate-pulse" />Chargement des demandes…</div> : null}
        {error ? <div className="flex items-start gap-2 rounded-2xl bg-[#fff1f0] p-4 text-sm font-semibold text-[var(--omni-danger)]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p>Les demandes ne sont pas disponibles pour le moment.</p><button type="button" onClick={() => void refresh()} className="mt-2 underline underline-offset-2">Réessayer</button></div></div> : null}
        {!loading && !error && live.length === 0 ? <div className="rounded-2xl border border-dashed border-black/10 bg-white/55 p-6 text-center"><PackageSearch className="mx-auto h-7 w-7 text-[var(--omni-ink-muted)]" /><p className="mt-2 font-extrabold">Aucune demande en direct</p><p className="mt-1 text-sm text-[var(--omni-ink-muted)]">Les besoins proches de votre facilité apparaîtront ici.</p></div> : null}

        <ul className="space-y-3">
          {live.map((request) => (
            <li key={request.id} className="rounded-[1.35rem] border border-black/5 bg-white/75 p-4 shadow-[var(--omni-shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-display text-xl font-extrabold">{request.search_term}</p><p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{request.quantity} unité(s) · {formatDateFr(request.created_at)}{request.distance_km !== null ? ` · ${request.distance_km.toFixed(1)} km` : ""}</p></div>
                {request.answered ? <span className="omni-clean-state-badge bg-[#eef8f4] text-[var(--omni-success)]"><Check className="h-3.5 w-3.5" />Répondu</span> : <span className="omni-clean-state-badge bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]">À traiter</span>}
              </div>

              <div className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl bg-[var(--omni-paper)] p-3">
                {request.matched_product_photo_url ? <img src={request.matched_product_photo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]"><PackageSearch className="h-5 w-5" /></div>}
                <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--omni-orange-deep)]">Produit recherché</p><p className="break-words text-sm font-extrabold">{request.matched_product_name ?? request.search_term}</p><p className="mt-1 break-words text-xs font-semibold text-[var(--omni-ink-muted)]">{request.buyer_name ? `Demande de ${request.buyer_name}` : "Demande Omni"}</p><p className="mt-1 break-words text-xs text-[var(--omni-ink-muted)]">{request.matched_product_name ? `Correspondance catalogue${request.matched_product_price != null ? ` · ${formatFcfa(request.matched_product_price)}` : ""}${request.matched_product_quantity != null ? ` · ${request.matched_product_quantity} disponible(s)` : ""}` : "Correspondance à confirmer avant réponse"}</p></div>
              </div>

              {!request.answered && request.matched_product_name ? <button type="button" onClick={() => seedMatchedProduct(request)} className="omni-clean-secondary-button mt-3 min-h-11 w-full">Utiliser ce produit pour répondre</button> : null}

              {request.answered ? (
                <div className="mt-3 space-y-2 rounded-2xl bg-[var(--omni-orange-wash)] p-3"><p className="text-sm font-extrabold text-[var(--omni-orange-deep)]">{request.response_auto ? "Réponse automatique envoyée depuis votre stock Omni." : "Vous avez déjà répondu à cette demande."}</p>{request.response_auto && !request.response_corrected_at && request.response_id ? <div className="flex flex-wrap gap-2"><button type="button" className="omni-clean-secondary-button min-h-10" disabled={correctionBusy === request.response_id} onClick={() => void correctAnswer(request, "partial")}>Corriger en partiel</button><button type="button" className="omni-clean-secondary-button min-h-10 text-[var(--omni-danger)]" disabled={correctionBusy === request.response_id} onClick={() => void correctAnswer(request, "unavailable")}>Corriger en indisponible</button></div> : null}{request.response_corrected_at ? <p className="text-xs font-semibold text-[var(--omni-ink-muted)]">Correction enregistrée et acheteur notifié.</p> : null}</div>
              ) : (
                <div className="mt-3 space-y-3"><div className="grid gap-2 sm:grid-cols-2"><input className="omni-clean-field text-base" type="number" inputMode="numeric" min={0} placeholder="Prix FCFA" value={prices[request.id] ?? ""} onChange={(event) => setPrices((current) => ({ ...current, [request.id]: event.target.value }))} aria-label={`Prix pour ${request.search_term}`} /><input className="omni-clean-field text-base" type="number" inputMode="numeric" min={0} placeholder="Quantité disponible" value={quantities[request.id] ?? ""} onChange={(event) => setQuantities((current) => ({ ...current, [request.id]: event.target.value }))} aria-label={`Quantité disponible pour ${request.search_term}`} /></div><div className="grid gap-2 sm:grid-cols-3"><button type="button" className="omni-clean-primary-button min-h-11 bg-[var(--omni-success)]" disabled={busy === request.id} onClick={() => void answer(request.id, "available")}>Disponible</button><button type="button" className="omni-clean-primary-button min-h-11 bg-[var(--omni-warning)] text-[var(--omni-ink)]" disabled={busy === request.id} onClick={() => void answer(request.id, "partial")}>Partiel</button><button type="button" className="omni-clean-secondary-button min-h-11 text-[var(--omni-danger)]" disabled={busy === request.id} onClick={() => void answer(request.id, "unavailable")}>Indisponible</button></div></div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="clean-demand-trends-title">
        <div><h3 id="clean-demand-trends-title" className="font-display text-lg font-extrabold">Tendances de recherche</h3><p className="text-xs font-semibold text-[var(--omni-ink-muted)]">Les besoins non couverts autour de votre facilité.</p></div>
        {demand.length === 0 ? <p className="rounded-2xl bg-white/60 p-4 text-sm text-[var(--omni-ink-muted)]">Aucune tendance enregistrée pour l’instant.</p> : <ul className="grid gap-2 sm:grid-cols-2">{demand.map((item) => <li key={item.search_term} className="rounded-2xl border border-black/5 bg-white/70 p-3"><p className="font-extrabold">{item.search_term}</p><p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{item.hits} recherche(s) · dernière le {formatDateFr(item.last_seen)}</p></li>)}</ul>}
      </section>
    </div>
  );
}
