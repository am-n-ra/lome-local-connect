import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, X } from "lucide-react";
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
import { formatFcfa } from "@/lib/omni";
import { useAuth } from "@/lib/auth";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userPos?: { lat: number; lng: number } | null;
  initialTerm?: string | undefined;
  targetFacilityIds?: string[];
};

/** Mode B — broadcast one need to the active filtered result set. */
export function DemandRequestPanel({
  open,
  onOpenChange,
  userPos,
  initialTerm,
  targetFacilityIds = [],
}: Props) {
  const { user } = useAuth();
  const create = useServerFn(createDemandRequest);
  const list = useServerFn(listMyDemandRequests);
  const close = useServerFn(closeDemandRequest);

  const [term, setTerm] = useState(initialTerm ?? "");
  const [quantity, setQuantity] = useState(1);
  const [budgetMax, setBudgetMax] = useState("");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<DemandRequestRow[]>([]);
  const [responses, setResponses] = useState<(DemandResponseRow & { request_id: string })[]>([]);

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

  async function broadcast() {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Demande groupée</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas ? Diffusez votre besoin à tous les commerçants autour de vous : ceux
            qui l'ont vous répondent avec leur prix.
          </p>

          {!user && (
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour diffuser une demande.
            </p>
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
                La disponibilité sera vérifiée auprès des {targetFacilityIds.length} résultat(s)
                actuellement visibles. Ajustez la zone avec les filtres de recherche. Coût estimé :{" "}
                <span className="font-semibold text-foreground">
                  {Math.max(1, targetFacilityIds.length)} crédit(s)
                </span>
                .
              </p>
              <Button
                className="w-full"
                disabled={busy || term.trim().length < 2}
                onClick={() => void broadcast()}
              >
                <Megaphone className="mr-2 h-4 w-4" />
                {busy ? "Vérification…" : "Vérifier la disponibilité de tous"}
              </Button>
            </div>
          )}

          {requests.map((r) => {
            const answers = responses.filter((a) => a.request_id === r.id);
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
                  <div key={a.id} className="rounded-lg border border-border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{a.facility_name}</span>
                      <span className={a.available ? "text-forest" : "text-destructive"}>
                        {a.available ? "Disponible" : "Indisponible"}
                      </span>
                    </div>
                    {a.price !== null && (
                      <p className="text-muted-foreground">{formatFcfa(a.price)}</p>
                    )}
                    {a.message && <p className="text-muted-foreground">{a.message}</p>}
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
