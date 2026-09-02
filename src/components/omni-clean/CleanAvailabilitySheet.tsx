import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, HandCoins, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@/lib/useServerFn";
import { useAuth, savePendingAvailabilitySearch } from "@/lib/auth";
import { useMarket } from "@/lib/market";
import {
  closeDemandRequest,
  createDemandRequest,
  getBuyerAvailabilityEntitlement,
  listMyDemandRequests,
  type BuyerAvailabilityEntitlement,
  type DemandRequestRow,
  type DemandResponseRow,
} from "@/lib/demand.functions";
import { createPurchaseIntent } from "@/lib/checkout.functions";
import { cn } from "@/lib/utils";

export type CleanAvailabilityMode = "bulk" | "manual";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPos?: { lat: number; lng: number } | null;
  initialTerm?: string;
  targetFacilityIds?: string[];
  mode?: CleanAvailabilityMode;
  facilityName?: string | null;
  initialQuantity?: number;
  selectedProduct?: SelectedProduct | null;
  onChangeProduct?: () => void;
  resumeRequestId?: string | undefined;
  resumeResponseId?: string | undefined;
  onTransactionCreated?: (context: {
    transactionId: string;
    facilityId: string;
    facilityName: string;
    amount: number;
  }) => void;
};

type Scope = "facility" | "visible";
type SelectedProduct = { facilityId: string; productId: string; name: string; price: number | null; quantityAvailable: number | null };

function rankResponse(answer: { available: boolean; kind: string }) {
  if (answer.kind === "partial") return 1;
  return answer.available ? 0 : 2;
}

function responseLabel(answer: DemandResponseRow) {
  if (answer.kind === "partial") return "Partiel";
  return answer.available ? "Disponible" : "Indisponible";
}

function responseTone(answer: DemandResponseRow) {
  if (answer.kind === "partial") return "border-[var(--omni-warning)]/35 bg-[#fff7e9] text-[var(--omni-warning)]";
  if (answer.available) return "border-[var(--omni-success)]/35 bg-[#eef8f4] text-[var(--omni-success)]";
  return "border-[var(--omni-danger)]/25 bg-[#fff1f0] text-[var(--omni-danger)]";
}

export function CleanAvailabilitySheet({
  open,
  onOpenChange,
  userPos,
  initialTerm = "",
  targetFacilityIds = [],
  mode = "bulk",
  facilityName,
  initialQuantity = 1,
  selectedProduct = null,
  onChangeProduct,
  resumeRequestId,
  resumeResponseId,
  onTransactionCreated,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatMoney } = useMarket();
  const create = useServerFn(createDemandRequest);
  const list = useServerFn(listMyDemandRequests);
  const close = useServerFn(closeDemandRequest);
  const entitlementFn = useServerFn(getBuyerAvailabilityEntitlement);
  const intent = useServerFn(createPurchaseIntent);
  const [term, setTerm] = useState(initialTerm);
  const [quantity, setQuantity] = useState(Math.max(1, initialQuantity));
  const [budgetMax, setBudgetMax] = useState("");
  const [unlimitedBudget, setUnlimitedBudget] = useState(true);
  const [step, setStep] = useState(resumeRequestId || resumeResponseId ? 2 : 0);
  const [scope, setScope] = useState<Scope>(mode === "manual" ? "facility" : "visible");
  const [busy, setBusy] = useState(false);
  const [intentBusy, setIntentBusy] = useState<string | null>(null);
  const [requests, setRequests] = useState<DemandRequestRow[]>([]);
  const [responses, setResponses] = useState<(DemandResponseRow & { request_id: string })[]>([]);
  const [entitlement, setEntitlement] = useState<BuyerAvailabilityEntitlement | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const selectedTargetFacilityIds = useMemo(
    () => (scope === "facility" ? targetFacilityIds.slice(0, 1) : targetFacilityIds),
    [scope, targetFacilityIds],
  );
  const selectedMode: CleanAvailabilityMode = scope === "facility" ? "manual" : mode;

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const result = await list({});
      setRequests(result.requests);
      setResponses(result.responses);
      setLoadError(false);
      if (resumeRequestId) setStep(2);
    } catch {
      setLoadError(true);
    }
  }, [list, resumeRequestId, user]);

  useEffect(() => {
    if (!open) return;
    setTerm(selectedProduct?.name ?? initialTerm);
    setQuantity(Math.max(1, initialQuantity));
    setScope(mode === "manual" ? "facility" : "visible");
    setStep(resumeRequestId || resumeResponseId ? 2 : 0);
    setSubmittedRequestId(resumeRequestId ?? null);
    if (user) void refresh();
  }, [initialQuantity, initialTerm, mode, open, refresh, resumeRequestId, resumeResponseId, selectedProduct?.name, user]);

  useEffect(() => {
    if (!open || !user || mode === "manual") return;
    void entitlementFn({})
      .then(setEntitlement)
      .catch(() => setEntitlement({ plan: "free", bulkAllowed: false, maxTargets: 240 }));
  }, [entitlementFn, mode, open, user]);

  const activeRequestId =
    resumeRequestId ?? responses.find((response) => response.id === resumeResponseId)?.request_id;
  const currentRequestId = activeRequestId ?? submittedRequestId;
  const hasSubmittedRequest = Boolean(currentRequestId || resumeRequestId || resumeResponseId);
  const displayRequests = currentRequestId
    ? requests.filter((request) => request.id === currentRequestId)
    : [];

  function redirectToAuth() {
    savePendingAvailabilitySearch({
      term,
      category: null,
      filters: null,
      targetFacilityIds: selectedTargetFacilityIds,
      location: userPos ?? null,
      locationSource: userPos ? "browser" : "market_fallback",
      quantity,
      demandOpen: true,
      demandMode: selectedMode,
      selectedProduct,
    });
    navigate({ to: "/auth", search: { redirectTo: "/carte?pendingSearch=1" } });
  }

  async function submitRequest() {
    if (!user) {
      redirectToAuth();
      return;
    }
    const effectiveTerm = selectedProduct?.name ?? term.trim();
    if (effectiveTerm.length < 2) {
      toast.error("Sélectionnez un produit ou indiquez au moins deux caractères.");
      setStep(0);
      return;
    }
    if (scope === "visible" && entitlement?.bulkAllowed !== true) {
      toast.error("La vérification groupée est réservée au plan Pro.");
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const created = await create({
        data: {
          searchTerm: effectiveTerm,
          productId: selectedProduct?.productId ?? null,
          quantity,
          latitude: userPos?.lat ?? null,
          longitude: userPos?.lng ?? null,
          budgetMax: unlimitedBudget || !budgetMax ? null : Number(budgetMax),
          targetFacilityIds: selectedTargetFacilityIds,
          mode: selectedMode,
        },
      });
      setSubmittedRequestId(created.id);
      toast.success("Vérification lancée.");
      setStep(2);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de lancer la vérification.");
    } finally {
      setBusy(false);
    }
  }

  async function createIntent(request: DemandRequestRow, answer: DemandResponseRow & { request_id: string }) {
    if (!user) {
      redirectToAuth();
      return;
    }
    setIntentBusy(answer.id);
    try {
      const result = await intent({
        data: {
          demandResponseId: answer.id,
          quantity: answer.quantity ?? request.quantity,
          paymentMode: "cash",
        },
      });
      onTransactionCreated?.({
        transactionId: result.transactionId,
        facilityId: answer.facility_id,
        facilityName: answer.facility_name,
        amount: answer.price ?? 0,
      });
      toast.success("Intention d’achat créée.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Intention impossible.");
    } finally {
      setIntentBusy(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(30,28,26,.22)] p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clean-availability-title"
        className="omni-clean-flow-sheet flex max-h-[min(92dvh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Disponibilité</p>
            <h2 id="clean-availability-title" className="mt-1 font-display text-2xl font-extrabold tracking-[-0.04em]">
              {step < 2 ? "Vérifier la disponibilité" : "Réponses de disponibilité"}
            </h2>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer" className="omni-clean-icon-button h-11 w-11">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-6 flex items-center gap-2" aria-label="Progression de la vérification">
            {["Produit", "Scope", "Contraintes"].map((label, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold", index <= step ? "bg-[var(--omni-orange)] text-white" : "bg-[var(--omni-paper)] text-[var(--omni-ink-muted)]")}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={cn("truncate text-xs font-bold", index <= step ? "text-[var(--omni-ink)]" : "text-[var(--omni-ink-muted)]")}>{label}</span>
                {index < 2 ? <div className={cn("h-px min-w-3 flex-1", index < step ? "bg-[var(--omni-orange)]" : "bg-black/10")} /> : null}
              </div>
            ))}
          </div>

          {!user ? (
            <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
              <p className="font-display text-xl font-extrabold">Créez votre compte pour continuer</p>
              <p className="mt-2 text-sm leading-6 text-[var(--omni-ink-muted)]">La carte reste consultable sans compte. Lancer une vérification lie votre demande à votre compte Omni.</p>
              <button type="button" onClick={redirectToAuth} className="omni-clean-primary-button mt-5 min-h-12 w-full">Créer mon compte</button>
            </div>
          ) : null}

          {user && step === 0 ? (
              <section className="space-y-4">
              <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Produit ou service</p>
                {selectedProduct ? (
                  <div className="mt-4 rounded-[1.25rem] border border-[var(--omni-orange)] bg-[var(--omni-orange-wash)] p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--omni-orange-deep)]">Correspond à votre recherche</p>
                    <p className="mt-2 font-display text-xl font-extrabold">{selectedProduct.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--omni-ink-muted)]">Produit du catalogue sélectionné · {facilityName ?? "facilité ciblée"}</p>
                    {onChangeProduct ? <button type="button" onClick={onChangeProduct} className="omni-clean-secondary-button mt-4 min-h-10 w-full">Changer de produit</button> : null}
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm leading-6 text-[var(--omni-ink-muted)]">Nous vérifions ce qui peut réellement être disponible maintenant.</p>
                    <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Ex. : chaises de bureau" className="omni-clean-field mt-4" autoFocus />
                  </>
                )}
              </div>
              {facilityName ? <div className="rounded-[1.25rem] border border-black/5 bg-white/70 p-4 text-sm font-bold">Chez {facilityName}</div> : null}
            </section>
          ) : null}

          {user && step === 1 ? (
            <section className="space-y-4">
              <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Votre recherche</p>
                <p className="mt-2 font-display text-xl font-extrabold">{term}</p>
                <p className="mt-1 text-sm text-[var(--omni-ink-muted)]">Le scope ne change pas votre requête.</p>
              </div>
              <button type="button" onClick={() => setScope("facility")} className={cn("w-full rounded-[1.35rem] border p-5 text-left", scope === "facility" ? "border-[var(--omni-orange)] bg-[var(--omni-orange-wash)]" : "border-black/5 bg-white/70")}>
                <span className="font-extrabold">{scope === "facility" ? "●" : "○"} Cette facilité</span>
                <span className="mt-1 block text-sm text-[var(--omni-ink-muted)]">{facilityName ?? "Une demande ciblée"}</span>
              </button>
              <button type="button" onClick={() => entitlement?.bulkAllowed && setScope("visible")} disabled={mode === "manual" || entitlement?.bulkAllowed === false} className={cn("w-full rounded-[1.35rem] border p-5 text-left disabled:cursor-not-allowed disabled:opacity-55", scope === "visible" ? "border-[var(--omni-orange)] bg-[var(--omni-orange-wash)]" : "border-black/5 bg-white/70")}>
                <span className="font-extrabold">{scope === "visible" ? "●" : "○"} Plusieurs facilités</span>
                <span className="mt-1 block text-sm text-[var(--omni-ink-muted)]">{entitlement?.bulkAllowed ? `${targetFacilityIds.length} offres visibles · Pro` : "Disponible avec Omni Pro"}</span>
              </button>
            </section>
          ) : null}

          {user && step === 2 && !hasSubmittedRequest ? (
            <section className="space-y-4">
              <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Contraintes de votre demande</p>
                <p className="mt-2 font-display text-xl font-extrabold">{term}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--omni-ink-muted)]">Ces paramètres restent privés et servent à classer les réponses. Ils ne sont pas transmis au vendeur.</p>
              </div>
              <label className="block rounded-[1.5rem] border border-black/5 bg-white/80 p-5">
                <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--omni-ink-muted)]">Quantité</span>
                <span className="mt-1 block text-sm font-semibold text-[var(--omni-ink-muted)]">Unités souhaitées</span>
                <input className="omni-clean-field mt-3 text-base" inputMode="numeric" type="number" min={1} max={999} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(999, Number(event.target.value) || 1)))} aria-label="Quantité souhaitée" />
              </label>
              <div className="rounded-[1.5rem] border border-black/5 bg-white/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--omni-ink-muted)]">Budget maximum</p><p className="mt-1 text-sm font-semibold text-[var(--omni-ink-muted)]">Optionnel et privé</p></div>
                  <label className="flex min-h-11 items-center gap-2 text-sm font-extrabold"><input type="checkbox" checked={unlimitedBudget} onChange={(event) => setUnlimitedBudget(event.target.checked)} className="h-5 w-5 accent-[var(--omni-orange)]" />Illimité</label>
                </div>
                {!unlimitedBudget ? <input className="omni-clean-field mt-3 text-base" inputMode="numeric" type="number" min={0} max={100000000} value={budgetMax} onChange={(event) => setBudgetMax(event.target.value.replace(/\D/g, ""))} placeholder="Montant maximum en FCFA" aria-label="Budget maximum en FCFA" /> : <p className="mt-3 rounded-xl bg-[var(--omni-paper)] p-3 text-sm font-bold text-[var(--omni-ink-muted)]">Omni peut comparer sans plafond de budget.</p>}
              </div>
            </section>
          ) : null}

          {user && step === 2 && hasSubmittedRequest ? (
            <section className="space-y-5">
              {!displayRequests.length ? (
                <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
                  <div className="flex items-center gap-2 text-[var(--omni-orange-deep)]"><Clock3 className="h-4 w-4" /><span className="text-xs font-extrabold uppercase tracking-[0.14em]">Vérification en cours</span></div>
                  <p className="mt-3 text-sm leading-6 text-[var(--omni-ink-muted)]">Omni vérifie cette offre selon les informations disponibles. Une confirmation vendeur sera demandée seulement si nécessaire.</p>
                </div>
              ) : null}

              {displayRequests.map((request) => {
                const answers = responses.filter((answer) => answer.request_id === request.id).sort((a, b) => rankResponse(a) - rankResponse(b) || (a.price ?? Infinity) - (b.price ?? Infinity));
                return (
                  <div key={request.id} className="rounded-[1.5rem] border border-black/5 bg-white/80 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl font-extrabold">{request.search_term}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{request.targeted_count} facilité(s) · {request.mode === "bulk" ? "vérification groupée" : "vérification ciblée"}</p>
                      </div>
                      {request.status === "open" ? <button type="button" onClick={async () => { await close({ data: { id: request.id } }); await refresh(); }} className="omni-clean-icon-button h-10 w-10" aria-label="Clôturer la demande"><X className="h-4 w-4" /></button> : null}
                    </div>
                    <div className="mt-4 space-y-3">
                      {answers.map((answer) => {
                        const eligible = answer.available || answer.kind === "partial";
                        return (
                          <div key={answer.id} className="rounded-[1.25rem] border border-black/5 bg-[var(--omni-paper)] p-4">
                            <div className="flex items-center justify-between gap-3"><p className="font-bold">{answer.facility_name}</p><span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-extrabold", responseTone(answer))}>{responseLabel(answer)}</span></div>
                            <p className="mt-2 text-sm font-bold">{answer.price != null ? formatMoney(answer.price) : "Prix à confirmer"}{answer.quantity != null ? ` · ${answer.quantity} unité(s)` : ""}</p>
                            {answer.message ? <p className="mt-1 text-sm leading-5 text-[var(--omni-ink-muted)]">{answer.message}</p> : null}
                            {eligible ? <button type="button" disabled={intentBusy === answer.id} onClick={() => void createIntent(request, answer)} className="omni-clean-primary-button mt-4 min-h-12 w-full"><HandCoins className="h-4 w-4" />{intentBusy === answer.id ? "Création…" : "Je veux acheter cette offre"}</button> : null}
                          </div>
                        );
                      })}
                    </div>
                    {loadError ? <button type="button" onClick={() => void refresh()} className="omni-clean-secondary-button mt-4 min-h-11 w-full">Réessayer</button> : null}
                  </div>
                );
              })}
            </section>
          ) : null}
        </div>

        {user && step < 2 ? (
          <div className="flex gap-2 border-t border-black/5 px-5 py-4 sm:px-6">
            {step > 0 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="omni-clean-secondary-button min-h-12 flex-1"><ArrowLeft className="h-4 w-4" />Retour</button> : null}
            <button type="button" onClick={() => step === 1 ? setStep(2) : setStep(1)} disabled={busy || (step === 0 && term.trim().length < 2)} className="omni-clean-primary-button min-h-12 flex-1">Continuer<ArrowRight className="h-4 w-4" /></button>
          </div>
        ) : null}
        {user && step === 2 && !hasSubmittedRequest ? (
          <div className="flex gap-2 border-t border-black/5 px-5 py-4 sm:px-6">
            <button type="button" onClick={() => setStep(1)} className="omni-clean-secondary-button min-h-12 flex-1"><ArrowLeft className="h-4 w-4" />Retour</button>
            <button type="button" onClick={() => void submitRequest()} disabled={busy} className="omni-clean-primary-button min-h-12 flex-1">{busy ? "Envoi…" : "Envoyer la demande"}</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
