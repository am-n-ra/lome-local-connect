import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HandCoins, Megaphone, X } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userPos?: { lat: number; lng: number } | null;
  initialTerm?: string | undefined;
  targetFacilityIds?: string[];
  mode?: "bulk" | "manual";
  facilityName?: string | null;
  initialQuantity?: number;
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

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const res = await list({});
      setRequests(res.requests);
      setResponses(res.responses);
    } catch {
      setRequests([]);
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
      targetFacilityIds,
      location: userPos ?? null,
      locationSource: userPos ? "browser" : "market_fallback",
      quantity,
      demandOpen: true,
      demandMode: mode,
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
          targetFacilityIds,
          mode,
        },
      });
      toast.success(
        `Vérification lancée sur ${res.targeted} commerce(s) pour ${res.creditCost} crédit(s), dont ${res.aiAnswered} réponse(s) IA.`,
      );
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

  const manual = targetFacilityIds.length === 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "manual" ? "Vérifier la disponibilité" : "Demande groupée"}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            {mode === "manual"
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

          {user && (
            <div className="omni-card space-y-3 p-3">
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Ex. : ciment 50 kg, robe wax taille M…"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  placeholder="Quantité"
                />
                <Input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="Budget max"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {mode === "manual"
                  ? `La demande sera envoyée uniquement à ${facilityName ?? "ce commerce"}. Les demandes manuelles ne consomment pas le quota bulk.`
                  : `La disponibilité sera vérifiée auprès des ${targetFacilityIds.length} résultat(s) actuellement visibles. Ajustez la zone avec les filtres de recherche. Coût estimé : ${Math.max(1, targetFacilityIds.length)} crédit(s).`}
              </p>
              <Button
                className="w-full"
                disabled={busy || term.trim().length < 2}
                onClick={() => void broadcast()}
              >
                <Megaphone className="mr-2 h-4 w-4" />
                {busy
                  ? "Vérification…"
                  : mode === "manual"
                    ? "Vérifier auprès de ce commerce"
                    : "Vérifier la disponibilité de tous"}
              </Button>
            </div>
          )}

          {requests.map((r) => {
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
                      {r.response_count} réponse(s) · {r.targeted_count} cible(s) · {r.credit_cost}
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
                <div className="grid gap-1 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Coût crédits :</span>{" "}
                    {r.credit_cost}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Cibles :</span>{" "}
                    {r.targeted_count} commerce(s)
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Résumé IA :</span>{" "}
                    {r.ai_summary ?? "En attente de réponses suffisantes."}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Recommandation :</span>{" "}
                    {r.ai_recommended_facility_name ?? "Aucune recommandation pour le moment."}
                  </p>
                </div>
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
      </SheetContent>
    </Sheet>
  );
}

function rankAnswer(a: { available: boolean; kind: string }): number {
  if (a.kind === "partial") return 1;
  return a.available ? 0 : 2;
}
