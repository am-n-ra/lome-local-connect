import { useEffect, useState } from "react";
import { Check, ChevronDown, FileCheck2, LoaderCircle, RotateCcw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@/lib/useServerFn";
import {
  listFacilityClaimEvidenceForStaff,
  listPendingFacilityClaimRequests,
  reviewFacilityClaimRequest,
  type FacilityClaimEvidence,
  type FacilityClaimRequest,
} from "@/lib/preverification.functions";

const EVIDENCE_LABEL: Record<string, string> = {
  identity: "Identité",
  relationship: "Relation",
  facility: "Facilité",
  offer: "Offre",
};

export function VerificationReviewPanel() {
  const fetchRequests = useServerFn(listPendingFacilityClaimRequests);
  const fetchEvidence = useServerFn(listFacilityClaimEvidenceForStaff);
  const review = useServerFn(reviewFacilityClaimRequest);
  const [requests, setRequests] = useState<FacilityClaimRequest[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, FacilityClaimEvidence[]>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      setRequests(await fetchRequests());
    } catch {
      toast.error("Impossible de charger la file de vérification.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function toggle(requestId: string) {
    if (openId === requestId) {
      setOpenId(null);
      return;
    }
    setOpenId(requestId);
    if (evidence[requestId]) return;
    try {
      const rows = await fetchEvidence({ data: { requestId } });
      setEvidence((current) => ({ ...current, [requestId]: rows }));
    } catch {
      toast.error("Impossible de charger les preuves de cette demande.");
    }
  }

  async function decide(requestId: string, outcome: "certified" | "unconfirmed" | "changes_requested" | "rejected") {
    const reason = reasons[requestId]?.trim();
    if (!reason || reason.length < 3) {
      toast.error("Ajoutez une raison explicite avant de décider.");
      return;
    }
    setBusyId(requestId);
    try {
      await review({ data: { requestId, outcome, reason } });
      toast.success(outcome === "certified" ? "Facilité certifiée." : outcome === "unconfirmed" ? "Facilité passée en non confirmée." : "Décision enregistrée.");
      setRequests((current) => current.filter((item) => item.id !== requestId));
      setOpenId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "La revue n’a pas pu être enregistrée.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="omni-card space-y-4 p-4 sm:p-5" data-omni-verification-review>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Confiance · revue manuelle</p><h2 className="mt-1 font-display text-2xl font-extrabold">Demandes de vérification</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">La facilité reste non revendiquée pendant la revue. Seule cette décision peut produire Certifiée ou Non confirmée.</p></div><Button type="button" variant="outline" onClick={() => void reload()} disabled={loading}><RotateCcw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />Actualiser</Button></div>
      {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Chargement de la file…</div> : requests.length === 0 ? <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">Aucune demande à examiner.</div> : <div className="space-y-3">{requests.map((request) => { const isOpen = openId === request.id; const rows = evidence[request.id] ?? []; return <article key={request.id} className="rounded-2xl border border-border bg-background/70"><button type="button" onClick={() => void toggle(request.id)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left"><span className="min-w-0"><span className="block truncate font-bold">{request.facility_name ?? "Facilité sans nom"}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{request.claimant_name}{request.claimant_email ? ` · ${request.claimant_email}` : ""}</span></span><span className="flex shrink-0 items-center gap-2"><Badge variant="outline">{request.status === "changes_requested" ? "À corriger" : "À revoir"}</Badge><ChevronDown className={isOpen ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} /></span></button>{isOpen ? <div className="space-y-4 border-t border-border px-4 py-4"><div className="grid gap-2 sm:grid-cols-2">{rows.map((item) => <div key={item.id} className="rounded-xl bg-muted/50 p-3"><p className="text-xs font-bold">{EVIDENCE_LABEL[item.kind] ?? item.kind}</p><p className="mt-1 break-words text-sm">{item.reference || item.notes || "Preuve sans texte"}</p>{item.document_url ? <a className="mt-2 block truncate text-xs text-primary underline" href={item.document_url} target="_blank" rel="noreferrer">Ouvrir le document</a> : null}</div>)}</div><Textarea value={reasons[request.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Raison de la décision ou précisions demandées" maxLength={2000} /><div className="flex flex-wrap gap-2"><Button type="button" disabled={busyId === request.id} onClick={() => void decide(request.id, "certified")}><Check className="h-4 w-4" />Certifier</Button><Button type="button" variant="secondary" disabled={busyId === request.id} onClick={() => void decide(request.id, "unconfirmed")}><ShieldAlert className="h-4 w-4" />Non confirmée</Button><Button type="button" variant="outline" disabled={busyId === request.id} onClick={() => void decide(request.id, "changes_requested")}><FileCheck2 className="h-4 w-4" />Demander des changements</Button><Button type="button" variant="destructive" disabled={busyId === request.id} onClick={() => void decide(request.id, "rejected")}><X className="h-4 w-4" />Refuser</Button></div></div> : null}</article>; })}</div>}
    </section>
  );
}
