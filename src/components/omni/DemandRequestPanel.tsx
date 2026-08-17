import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@/lib/useServerFn";
import { ArrowLeft, ArrowRight, HandCoins, Megaphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  closeDemandRequest,
  createDemandRequest,
  listMyDemandRequests,
  type DemandRequestRow,
  type DemandResponseRow,
} from "@/lib/demand.functions";
import { useMarket } from "@/lib/market";
import { savePendingAvailabilitySearch, useAuth } from "@/lib/auth";
import { createPurchaseIntent } from "@/lib/checkout.functions";
import { OmniErrorState, OmniStepper } from "@/components/omni/ui/OmniPrimitives";
import { AVAILABILITY_PROGRESS_LABELS } from "@/lib/transaction-progress";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userPos?: { lat: number; lng: number } | null;
  initialTerm?: string | undefined;
  targetFacilityIds?: string[];
  mode?: "bulk" | "manual";
  facilityName?: string | null;
  initialQuantity?: number;
  onTransactionCreated?: (context: {
    transactionId: string;
    facilityId: string;
    facilityName: string;
    amount: number;
  }) => void;
};

/** Mode B — broadcast one need to the active filtered result set. */
export function DemandRequestPanel({
  open,
  onOpenChange,
  userPos,
  initialTerm,
  targetFacilityIds = [],
  mode = "bulk",
  facilityName,
  initialQuantity = 1,
  onTransactionCreated,
}: Props) {
  const navigate = useNavigate();
  const { formatMoney } = useMarket();
  const { user } = useAuth();
  const create = useServerFn(createDemandRequest);
  const list = useServerFn(listMyDemandRequests);
  const close = useServerFn(closeDemandRequest);
  const createIntent = useServerFn(createPurchaseIntent);

  const [term, setTerm] = useState(initialTerm ?? "");
  const [quantity, setQuantity] = useState(initialQuantity);
  const [budgetMax, setBudgetMax] = useState("");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<DemandRequestRow[]>([]);
  const [responses, setResponses] = useState<(DemandResponseRow & { request_id: string })[]>([]);
  const [intentBusy, setIntentBusy] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<"facility" | "visible">(
    mode === "manual" ? "facility" : "visible",
  );
  const [loadError, setLoadError] = useState(false);
  const selectedTargetFacilityIds =
    scope === "facility" ? targetFacilityIds.slice(0, 1) : targetFacilityIds;
  const selectedMode: "bulk" | "manual" = scope === "facility" ? "manual" : mode;

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const res = await list({});
      setRequests(res.requests);
      setResponses(res.responses);
      setLoadError(false);
    } catch {
      setRequests([]);
      setResponses([]);
      setLoadError(true);
    }
  }, [list, user]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (initialTerm) setTerm(initialTerm);
  }, [initialTerm]);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

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
    });
    navigate({ to: "/auth", search: { redirectTo: "/carte?pendingSearch=1" } });
  }

  async function startPurchaseIntent(
    request: DemandRequestRow,
    answer: DemandResponseRow & { request_id: string },
  ) {
    if (!user) {
      redirectToAuth();
      return;
    }
    setIntentBusy(answer.id);
    try {
      const result = await createIntent({
        data: {
          demandResponseId: answer.id,
          quantity: answer.quantity ?? request.quantity,
          amount: answer.price ?? undefined,
          paymentMode: "cash",
        },
      });
      onTransactionCreated?.({
        transactionId: result.transactionId,
        facilityId: answer.facility_id,
        facilityName: answer.facility_name,
        amount: answer.price ?? 0,
      });
      toast.success(`Intention d'achat créée. Référence ${result.transactionId.slice(0, 8)}.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Intention impossible.");
    } finally {
      setIntentBusy(null);
    }
  }

  async function broadcast() {
    if (!user) {
      redirectToAuth();
      return;
    }
    if (term.trim().length < 2) return;
    setBusy(true);
    try {
      const res = await create({
        data: {
          searchTerm: term.trim(),
          quantity,
          latitude: userPos?.lat ?? null,
          longitude: userPos?.lng ?? null,
          budgetMax: budgetMax ? Number(budgetMax) : null,
          targetFacilityIds: selectedTargetFacilityIds,
          mode: selectedMode,
        },
      });
      toast.success(`Vérification lancée sur ${res.targeted} commerce(s).`);
      setTerm("");
      setQuantity(1);
      setBudgetMax("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  const steps = [...AVAILABILITY_PROGRESS_LABELS];

  function continueFromStep() {
    if (step === 0) {
      if (term.trim().length < 2) {
        toast.error("Indiquez au moins deux caractères pour le produit.");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    void broadcast();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-border/70 px-5 pb-4 pt-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>
              {selectedMode === "manual" ? "Vérifier la disponibilité" : "Demande groupée"}
            </SheetTitle>
            <span className="text-xs font-semibold text-muted-foreground">{step + 1}/3</span>
          </div>
          <div className="mt-3">
            <OmniStepper steps={steps} current={step} />
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-sm text-muted-foreground">
            {selectedMode === "manual"
              ? `Vérifiez la disponibilité directement auprès de ${facilityName ?? "ce commerce"}.`
              : "Vous ne trouvez pas ? Diffusez votre besoin à tous les commerçants autour de vous : ceux qui l'ont vous répondent avec leur prix."}
          </p>

          {!user && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm text-muted-foreground">
                La carte reste consultable sans compte. Connectez-vous pour lancer la vérification
                de disponibilité auprès des commerces.
              </p>
              <Button className="w-full" onClick={redirectToAuth}>
                Se connecter et continuer
              </Button>
            </div>
          )}

          {user && step === 0 && (
            <div className="omni-card space-y-3 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Quoi</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quel produit souhaitez-vous vérifier ?
                </p>
              </div>
              <Input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Ex. : ciment 50 kg, robe wax taille M…"
              />
            </div>
          )}

          {user && step === 1 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Produit sélectionné
                </p>
                <p className="mt-1 font-display text-lg font-bold">{term}</p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition ${scope === "facility" ? "border-primary bg-primary/8" : "border-border bg-card"}`}
                  onClick={() => setScope("facility")}
                  disabled={selectedMode !== "manual" && targetFacilityIds.length !== 1}
                >
                  <span className="font-semibold">
                    {scope === "facility" ? "◉" : "○"} Ce commerce
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {facilityName ?? "Commerce sélectionné"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition ${scope === "visible" ? "border-primary bg-primary/8" : "border-border bg-card"}`}
                  onClick={() => setScope("visible")}
                  disabled={selectedMode === "manual"}
                >
                  <span className="font-semibold">
                    {scope === "visible" ? "◉" : "○"} Résultats visibles
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {targetFacilityIds.length} commerce(s) sur la zone actuelle
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedMode === "manual"
                  ? "La demande manuelle ne consomme pas le quota de vérifications groupées."
                  : `La vérification concerne les ${targetFacilityIds.length} résultat(s) visibles. Le coût éventuel sera affiché avant l'envoi.`}
              </p>
            </div>
          )}

          {user && step === 2 && (
            <div className="omni-card space-y-4 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Contraintes
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajoutez uniquement les contraintes utiles à votre demande.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs font-semibold">
                  Quantité
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold">
                  Budget maximum
                  <Input
                    type="number"
                    min={0}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Illimité"
                  />
                </label>
              </div>
              <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                Le budget est optionnel et reste privé : il n'est jamais transmis au vendeur dans la
                demande.
              </p>
            </div>
          )}

          {user && loadError ? (
            <OmniErrorState
              title="Les réponses ne sont pas disponibles"
              description="Votre demande peut être réessayée sans perdre les critères saisis."
              onRetry={() => void refresh()}
            />
          ) : null}

          {user &&
            step === 2 &&
            !loadError &&
            requests.map((r) => {
              const answers = responses
                .filter((a) => a.request_id === r.id)
                .slice()
                .sort(
                  (a, b) =>
                    rankAnswer(a) - rankAnswer(b) ||
                    (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY),
                );
              const bestId =
                answers.find((a) => a.available || a.kind === "partial")?.id ??
                answers[0]?.id ??
                null;
              return (
                <div key={r.id} className="omni-card space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold">{r.search_term}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.response_count} réponse(s) · {r.targeted_count} cible(s) ·{" "}
                        {r.credit_cost}
                        crédit(s) · {r.status === "open" ? "en cours" : "clôturée"}
                      </p>
                    </div>
                    {r.status === "open" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Clôturer"
                        onClick={async () => {
                          await close({ data: { id: r.id } });
                          await refresh();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="rounded-xl bg-muted/60 p-2 text-xs text-muted-foreground">
                    {r.targeted_count} commerce(s) ciblé(s). Les réponses restent manuelles et
                    apparaissent ici au fil de leur confirmation.
                  </p>
                  {answers.map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-lg border p-2 text-sm ${a.id === bestId ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {a.facility_name}
                          {a.id === bestId && (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              Meilleure option
                            </span>
                          )}
                        </span>
                        <span
                          className={
                            a.kind === "partial"
                              ? "text-gold"
                              : a.available
                                ? "text-primary"
                                : "text-destructive"
                          }
                        >
                          {a.kind === "partial"
                            ? "Partiel"
                            : a.available
                              ? "Disponible"
                              : "Indisponible"}
                        </span>
                      </div>
                      {(a.price !== null || a.quantity !== null) && (
                        <p className="text-muted-foreground">
                          {a.price !== null ? formatMoney(a.price) : "Prix à confirmer"}
                          {a.quantity !== null ? ` · ${a.quantity} unité(s) disponible(s)` : ""}
                        </p>
                      )}
                      {a.message && <p className="text-muted-foreground">{a.message}</p>}
                      {(a.available || a.kind === "partial") && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          disabled={intentBusy === a.id}
                          onClick={() => void startPurchaseIntent(r, a)}
                        >
                          <HandCoins className="mr-1.5 h-4 w-4" />
                          {intentBusy === a.id ? "Création…" : "Je veux acheter"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
        {user ? (
          <div className="omni-safe-bottom shrink-0 border-t border-border/70 bg-card/95 p-4 backdrop-blur-md">
            <div className="flex gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setStep((value) => value - 1)}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
                </Button>
              ) : null}
              <Button
                type="button"
                className="flex-1"
                disabled={busy || (step === 0 && term.trim().length < 2)}
                onClick={continueFromStep}
              >
                {busy ? "Vérification…" : step === 2 ? "Envoyer la demande" : "Continuer"}
                {step < 2 && !busy ? <ArrowRight className="ml-1.5 h-4 w-4" /> : null}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function rankAnswer(a: { available: boolean; kind: string }): number {
  if (a.kind === "partial") return 1;
  return a.available ? 0 : 2;
}
