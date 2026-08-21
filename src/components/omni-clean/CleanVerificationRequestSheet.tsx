import { ArrowLeft, ArrowRight, Check, FileCheck2, LoaderCircle, Save, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useServerFn } from "@/lib/useServerFn";
import {
  createFacilityClaimRequest,
  getFacilityClaimRequest,
  listFacilityClaimEvidence,
  saveFacilityClaimEvidence,
  submitFacilityClaimRequest,
  type FacilityClaimEvidence,
  type FacilityClaimRequest,
} from "@/lib/preverification.functions";
import { cn } from "@/lib/utils";

type EvidenceKind = "identity" | "relationship" | "facility" | "offer";

type Props = {
  open: boolean;
  facilityId: string | null;
  facilityName: string | null;
  onOpenChange: (open: boolean) => void;
};

const STEPS: { kind: EvidenceKind; label: string; title: string; description: string }[] = [
  { kind: "identity", label: "Identité", title: "Qui êtes-vous ?", description: "Indiquez la personne qui demande la vérification de cette facilité." },
  { kind: "relationship", label: "Relation", title: "Quel est votre lien ?", description: "Expliquez votre relation avec la facilité ou la compagnie." },
  { kind: "facility", label: "Facilité", title: "Prouvez la facilité", description: "Confirmez les informations publiques et ajoutez un repère vérifiable." },
  { kind: "offer", label: "Offre", title: "Prouvez l’offre", description: "Décrivez le produit ou service réel, ou expliquez pourquoi le catalogue sera complété après revue." },
];

function statusCopy(request: FacilityClaimRequest | null) {
  if (!request) return null;
  if (request.status === "in_review") return { title: "Vérification en cours", text: "Un membre de l’équipe Omni examine vos preuves. La facilité reste publique et non revendiquée pendant cette revue." };
  if (request.status === "changes_requested") return { title: "Des précisions sont nécessaires", text: request.admin_reason ?? "Ajoutez les éléments demandés puis renvoyez votre dossier." };
  if (request.status === "approved_certified") return { title: "Facilité certifiée", text: "La certification a été décidée par Omni. Les opérations après vérification seront présentées dans un parcours séparé." };
  if (request.status === "approved_unconfirmed") return { title: "Facilité non confirmée", text: "Omni a validé une mise en route limitée avec un statut visiblement non confirmé. Les étapes suivantes appartiennent au parcours post-vérification." };
  if (request.status === "rejected") return { title: "Demande refusée", text: request.admin_reason ?? "La demande n’a pas été validée. La facilité reste non revendiquée." };
  return { title: "Demande enregistrée", text: "Votre dossier est sauvegardé. La facilité reste non revendiquée jusqu’à une décision de certification." };
}

export function CleanVerificationRequestSheet({ open, facilityId, facilityName, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const create = useServerFn(createFacilityClaimRequest);
  const getRequest = useServerFn(getFacilityClaimRequest);
  const listEvidence = useServerFn(listFacilityClaimEvidence);
  const saveEvidence = useServerFn(saveFacilityClaimEvidence);
  const submit = useServerFn(submitFacilityClaimRequest);
  const [request, setRequest] = useState<FacilityClaimRequest | null>(null);
  const [evidence, setEvidence] = useState<FacilityClaimEvidence[]>([]);
  const [step, setStep] = useState(0);
  const [claimantName, setClaimantName] = useState("");
  const [relationship, setRelationship] = useState<"owner" | "representative" | "employee" | "agent" | "other">("owner");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const currentEvidence = useMemo(
    () => evidence.find((item) => item.kind === STEPS[step]?.kind),
    [evidence, step],
  );
  const currentStatus = statusCopy(request);
  const terminal = Boolean(request && ["in_review", "approved_certified", "approved_unconfirmed", "rejected"].includes(request.status));

  useEffect(() => {
    if (!open || !facilityId || !user) return;
    setBusy(true);
    void getRequest({ data: { facilityId } })
      .then(async (existing) => {
        setRequest(existing);
        if (existing) {
          setClaimantName(existing.claimant_name);
          setRelationship(existing.relationship);
          const rows = await listEvidence({ data: { requestId: existing.id } });
          setEvidence(rows);
          const firstIncomplete = STEPS.findIndex((item) => !rows.some((row) => row.kind === item.kind));
          setStep(firstIncomplete >= 0 ? firstIncomplete : 0);
        }
      })
      .catch(() => toast.error("Impossible de charger votre demande de vérification."))
      .finally(() => setBusy(false));
  }, [facilityId, getRequest, listEvidence, open, user]);

  useEffect(() => {
    const row = currentEvidence;
    setReference(row?.reference ?? "");
    setNotes(row?.notes ?? "");
  }, [currentEvidence]);

  if (!open) return null;

  async function ensureRequest() {
    if (!user) {
      await navigate({ to: "/auth", search: { redirectTo: "/carte" } });
      return null;
    }
    if (!facilityId) return null;
    if (request) return request;
    if (claimantName.trim().length < 2) {
      toast.error("Indiquez le nom de la personne qui demande la vérification.");
      return null;
    }
    setBusy(true);
    try {
      const created = await create({
        data: {
          facilityId,
          claimantName: claimantName.trim(),
          relationship,
          claimantPhone: null,
          companyId: null,
        },
      });
      setRequest(created);
      return created;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la demande.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrentEvidence() {
    const ensured = await ensureRequest();
    const kind = STEPS[step]?.kind;
    if (!ensured || !kind) return false;
    if (!reference.trim() && !notes.trim()) {
      toast.error("Ajoutez une référence ou une note avant de continuer.");
      return false;
    }
    setBusy(true);
    try {
      const saved = await saveEvidence({
        data: {
          requestId: ensured.id,
          kind,
          reference: reference.trim() || null,
          documentUrl: null,
          notes: notes.trim() || null,
        },
      });
      setEvidence((rows) => [...rows.filter((row) => row.kind !== kind), saved]);
      toast.success("Preuve enregistrée.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’enregistrer cette preuve.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (step === 0 && claimantName.trim().length < 2) {
      toast.error("Indiquez le nom de la personne qui demande la vérification.");
      return;
    }
    const saved = await saveCurrentEvidence();
    if (!saved) return;
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  async function submitRequest() {
    const saved = await saveCurrentEvidence();
    if (!saved || !request) return;
    setBusy(true);
    try {
      const result = await submit({ data: { requestId: request.id } });
      setRequest(result);
      toast.success("Dossier envoyé à l’équipe de vérification.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Complétez les quatre preuves avant l’envoi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[rgba(30,28,26,.24)] p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="verification-sheet-title" className="omni-clean-flow-sheet flex max-h-[min(94dvh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]">
        <header className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Pré-vérification · {facilityName ?? "Facilité publique"}</p><h2 id="verification-sheet-title" className="mt-1 font-display text-2xl font-extrabold tracking-[-0.04em]">Demander une vérification</h2></div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer" className="omni-clean-icon-button h-11 w-11"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-5 flex items-center gap-2" aria-label="Progression de la vérification">
            {STEPS.map((item, index) => <div key={item.kind} className="flex min-w-0 flex-1 items-center gap-1.5"><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold", index <= step ? "bg-[var(--omni-orange)] text-white" : "bg-[var(--omni-paper)] text-[var(--omni-ink-muted)]")}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span><span className="truncate text-[10px] font-bold">{item.label}</span>{index < STEPS.length - 1 ? <span className="h-px min-w-2 flex-1 bg-black/10" /> : null}</div>)}
          </div>
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[var(--omni-paper)] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--omni-orange)]" /><p className="text-sm leading-6 text-[var(--omni-ink-muted)]">Cette action crée un dossier de vérification. Elle ne revendique pas la facilité et ne change pas son statut. Seule la revue d’un admin peut la rendre certifiée ou non confirmée.</p></div>
          {!user ? <div className="rounded-2xl border border-[var(--omni-orange)]/25 bg-[var(--omni-orange-wash)] p-5"><p className="font-display text-xl font-extrabold">Créez votre compte pour continuer</p><p className="mt-2 text-sm leading-6 text-[var(--omni-ink-muted)]">Votre facility et votre progression seront conservées après connexion.</p><button type="button" onClick={() => void navigate({ to: "/auth", search: { redirectTo: "/carte" } })} className="omni-clean-primary-button mt-4 min-h-12 w-full">Créer mon compte <ArrowRight className="h-4 w-4" /></button></div> : null}
          {user && currentStatus ? <div className="rounded-2xl border border-black/5 bg-white/75 p-5"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-[var(--omni-orange)]" /><p className="font-display text-xl font-extrabold">{currentStatus.title}</p></div><p className="mt-2 text-sm leading-6 text-[var(--omni-ink-muted)]">{currentStatus.text}</p></div> : null}
          {user && !terminal ? <section className="space-y-4">
            {step === 0 ? <div className="space-y-3"><label className="block space-y-1.5"><span className="text-xs font-extrabold">Nom de la personne</span><input className="omni-clean-field text-base" value={claimantName} onChange={(event) => setClaimantName(event.target.value)} placeholder="Nom complet" autoFocus /></label><label className="block space-y-1.5"><span className="text-xs font-extrabold">Relation avec la facilité</span><select className="omni-clean-field text-base" value={relationship} onChange={(event) => setRelationship(event.target.value as typeof relationship)}><option value="owner">Propriétaire</option><option value="representative">Représentant</option><option value="employee">Employé</option><option value="agent">Agent mandaté</option><option value="other">Autre</option></select></label></div> : null}
            {step > 0 ? <div className="rounded-2xl bg-[var(--omni-paper)] p-4 text-sm font-bold">{claimantName || "Votre demande"} · {STEPS[step]?.label}</div> : null}
            <div className="space-y-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">{STEPS[step]?.label}</p><h3 className="mt-1 font-display text-2xl font-extrabold">{STEPS[step]?.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--omni-ink-muted)]">{STEPS[step]?.description}</p></div><label className="block space-y-1.5"><span className="text-xs font-extrabold">Référence ou élément vérifiable</span><input className="omni-clean-field text-base" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex. document, lien public, repère, registre" /></label><label className="block space-y-1.5"><span className="text-xs font-extrabold">Note pour l’équipe Omni</span><textarea className="omni-clean-field min-h-28 text-base" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Expliquez ce que la preuve démontre." /></label><button type="button" onClick={() => void saveCurrentEvidence()} disabled={busy} className="omni-clean-secondary-button min-h-11 w-full"><Save className="h-4 w-4" />Enregistrer le brouillon</button></div>
          </section> : null}
        </div>
        {user && !terminal ? <footer className="flex gap-2 border-t border-black/5 bg-white/70 px-5 py-4 sm:px-6"><button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || busy} className="omni-clean-secondary-button min-h-12 flex-1"><ArrowLeft className="h-4 w-4" />Retour</button>{step < STEPS.length - 1 ? <button type="button" onClick={() => void next()} disabled={busy} className="omni-clean-primary-button min-h-12 flex-1">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Continuer <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={() => void submitRequest()} disabled={busy || !request} className="omni-clean-primary-button min-h-12 flex-1">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Envoyer à Omni <FileCheck2 className="h-4 w-4" /></button>}</footer> : null}
      </section>
    </div>
  );
}
