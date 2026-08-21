import { useState } from "react";
import { Image, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import type { SellerProductDraft } from "@/components/omni/vendor/SellerProductForm";

const INITIAL_DRAFT: SellerProductDraft = {
  name: "",
  price: "",
  quantity: "1",
  photoUrl: "",
  allocation: "100",
  allocatedOmni: "0",
  status: "active",
  couponCode: "",
  couponDescription: "",
  couponPercent: "10",
};

type Props = { atProductCap: boolean; onSubmit: (draft: SellerProductDraft) => Promise<void> };

export function CleanProductForm({ atProductCap, onSubmit }: Props) {
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const patch = (next: Partial<SellerProductDraft>) => setDraft((current) => ({ ...current, ...next }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim().length < 2 || !draft.price.trim()) {
      toast.error("Indiquez un nom et un prix valides.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(draft);
      setDraft(INITIAL_DRAFT);
      setAdvanced(false);
      toast.success("Produit ajouté au catalogue.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5 rounded-[1.4rem] border border-black/5 bg-white/65 p-4 sm:p-5">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Nouveau produit</p><h3 className="mt-1 font-display text-xl font-extrabold">Publier simplement</h3><p className="mt-1 text-sm leading-6 text-[var(--omni-ink-muted)]">Nom, prix, quantité et remise Omni. Les autres options restent secondaires.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-extrabold">Nom du produit</span><input className="omni-clean-field" value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="Ex. Ciment 50 kg" autoComplete="off" /></label>
        <label className="space-y-1.5"><span className="text-xs font-extrabold">Prix public (FCFA)</span><input className="omni-clean-field" inputMode="numeric" type="number" min="0" value={draft.price} onChange={(event) => patch({ price: event.target.value })} placeholder="12 000" /></label>
        <label className="space-y-1.5"><span className="text-xs font-extrabold">Quantité disponible</span><input className="omni-clean-field" inputMode="numeric" type="number" min="0" value={draft.quantity} onChange={(event) => patch({ quantity: event.target.value })} placeholder="1" /></label>
        <label className="space-y-1.5 sm:col-span-2"><span className="flex items-center gap-2 text-xs font-extrabold"><Image className="h-3.5 w-3.5 text-[var(--omni-orange)]" />Photo ou média (facultatif)</span><input className="omni-clean-field" value={draft.photoUrl} onChange={(event) => patch({ photoUrl: event.target.value })} placeholder="https://…" inputMode="url" /></label>
      </div>
      {draft.photoUrl.trim() ? <div className="flex items-center gap-3 rounded-2xl bg-[var(--omni-paper)] p-3"><img src={draft.photoUrl.trim()} alt="Aperçu du produit" className="h-16 w-16 rounded-xl object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /><p className="text-xs font-semibold text-[var(--omni-ink-muted)]">Ce média sera visible sur votre fiche produit.</p></div> : null}
      <div className="rounded-2xl bg-[var(--omni-paper)] p-3"><div className="flex items-center gap-2"><Tag className="h-4 w-4 text-[var(--omni-orange)]" /><p className="text-xs font-extrabold">Réduction Omni obligatoire</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-bold">Remise (%)</span><input className="omni-clean-field" inputMode="numeric" type="number" min="1" max="90" value={draft.couponPercent} onChange={(event) => patch({ couponPercent: event.target.value.replace(/\D/g, "") })} /></label><div className="rounded-xl bg-white/70 p-3 text-xs leading-5 text-[var(--omni-ink-muted)]">À l’intention d’achat, Omni générera le coupon unique lié à l’acheteur et à la transaction.</div></div></div>
      <button type="button" onClick={() => setAdvanced((value) => !value)} className="text-xs font-extrabold text-[var(--omni-orange-deep)]">{advanced ? "Masquer les options avancées" : "Afficher les options avancées"}</button>
      {advanced ? <div className="grid gap-3 rounded-2xl border border-black/5 bg-white/60 p-3 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-bold">Stock visible sur Omni (%)</span><input className="omni-clean-field" inputMode="numeric" type="number" min="0" max="100" value={draft.allocation} onChange={(event) => patch({ allocation: event.target.value })} /></label><label className="space-y-1.5"><span className="text-xs font-bold">Stock alloué aux réponses auto</span><input className="omni-clean-field" inputMode="numeric" type="number" min="0" value={draft.allocatedOmni} onChange={(event) => patch({ allocatedOmni: event.target.value })} /></label><p className="text-[11px] font-semibold leading-4 text-[var(--omni-ink-muted)] sm:col-span-2">Omni ne répond automatiquement que si la facilité est ouverte et que ce stock est supérieur à 0.</p><label className="space-y-1.5"><span className="text-xs font-bold">Publication</span><select className="omni-clean-field" value={draft.status} onChange={(event) => patch({ status: event.target.value as SellerProductDraft["status"] })}><option value="active">Actif</option><option value="draft">Brouillon</option><option value="paused">En pause</option><option value="sold_out">Épuisé</option></select></label></div> : null}
      {atProductCap ? <p className="rounded-xl bg-[#fff1f0] p-3 text-sm font-semibold text-[var(--omni-danger)]">La limite Free est atteinte. Passez en Pro pour publier davantage.</p> : null}
      <button type="submit" disabled={atProductCap || busy} className="omni-clean-primary-button min-h-12 w-full"><Plus className="h-4 w-4" />{busy ? "Publication…" : "Publier le produit"}</button>
    </form>
  );
}
